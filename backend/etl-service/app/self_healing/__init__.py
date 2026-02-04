"""
Self-Healing ETL Wrapper

Wraps ETL scripts with intelligent error handling that uses LLM to diagnose
and fix parsing errors in geospatial data formats.
"""

import asyncio
import json
import logging
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Callable, Optional

import httpx

logger = logging.getLogger(__name__)


class ETLError:
    """Represents an ETL processing error."""

    def __init__(
        self,
        script_name: str,
        error_type: str,
        error_message: str,
        stderr_output: str,
        input_data_snippet: Optional[str] = None,
    ):
        self.script_name = script_name
        self.error_type = error_type
        self.error_message = error_message
        self.stderr_output = stderr_output
        self.input_data_snippet = input_data_snippet
        self.timestamp = asyncio.get_event_loop().time()


class SelfHealingETL:
    """
    ETL wrapper with self-healing capabilities.

    When ETL scripts fail, this wrapper:
    1. Captures the error and input data
    2. Sends to LLM for diagnosis
    3. Receives suggested fix
    4. Applies fix and retries
    """

    def __init__(
        self,
        llm_endpoint: str = "http://localhost:11434/v1",
        llm_model: str = "qwen2.5-coder:7b",
        max_retries: int = 3,
        sandbox_enabled: bool = True,
    ):
        self.llm_endpoint = llm_endpoint
        self.llm_model = llm_model
        self.max_retries = max_retries
        self.sandbox_enabled = sandbox_enabled
        self.error_history: list[ETLError] = []

    async def run_with_healing(
        self,
        script_path: Path,
        input_data: bytes,
        script_type: str = "python",
    ) -> dict[str, Any]:
        """
        Run ETL script with self-healing on failure.

        Args:
            script_path: Path to ETL script
            input_data: Input data to process
            script_type: Script type (python, node, etc.)

        Returns:
            Result dict with success status, output, and any fixes applied
        """
        retry_count = 0
        last_error: Optional[ETLError] = None

        while retry_count < self.max_retries:
            try:
                result = await self._run_script(
                    script_path, input_data, script_type
                )
                return {
                    "success": True,
                    "output": result,
                    "retries": retry_count,
                    "fixes_applied": [],
                }
            except subprocess.CalledProcessError as e:
                error = ETLError(
                    script_name=script_path.name,
                    error_type="subprocess_error",
                    error_message=str(e),
                    stderr_output=e.stderr.decode() if e.stderr else "",
                    input_data_snippet=input_data[:1000].decode("utf-8", errors="ignore"),
                )
                last_error = error
                self.error_history.append(error)

                # Try to self-heal
                fix = await self._diagnose_and_fix(error, script_path)
                if fix:
                    logger.info(f"Applied fix: {fix.description}")
                    retry_count += 1
                    continue
                else:
                    # LLM couldn't fix, give up
                    return {
                        "success": False,
                        "error": error.error_message,
                        "retries": retry_count,
                        "fixes_applied": [],
                    }

        return {
            "success": False,
            "error": last_error.error_message if last_error else "Unknown error",
            "retries": retry_count,
            "fixes_applied": [],
        }

    async def _run_script(
        self, script_path: Path, input_data: bytes, script_type: str
    ) -> str:
        """Run ETL script and return stdout."""
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(input_data)
            tmp.flush()
            tmp_path = Path(tmp.name)

        try:
            if script_type == "python":
                cmd = [sys.executable, str(script_path), str(tmp_path)]
            elif script_type == "node":
                cmd = ["node", str(script_path), str(tmp_path)]
            else:
                cmd = [str(script_path), str(tmp_path)]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minute timeout
            )
            result.check_returncode()
            return result.stdout
        finally:
            tmp_path.unlink(missing_ok=True)

    async def _diagnose_and_fix(
        self, error: ETLError, script_path: Path
    ) -> Optional["ETLFix"]:
        """
        Use LLM to diagnose error and suggest fix.

        Returns:
            ETLFix if fix was applied, None otherwise
        """
        prompt = f"""
You are an expert ETL engineer debugging geospatial data parsing errors.

## Error
- Script: {error.script_name}
- Type: {error.error_type}
- Message: {error.error_message}
- Stderr: {error.stderr_output[:500]}

## Input Data Snippet
```
{error.input_data_snippet[:500]}
```

## Task
Analyze the error and the input data to determine the issue.
If the problem is with the input data format, suggest how to fix it.
If the problem is with the script, suggest a minimal fix.

## Output Format
Respond with JSON only:
{{
    "diagnosis": "Brief description of the problem",
    "fix_type": "input_fix|script_fix|no_fix",
    "suggestion": "Specific fix to apply",
    "confidence": 0.0-1.0
}}
"""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.llm_endpoint}/chat/completions",
                    json={
                        "model": self.llm_model,
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 500,
                    },
                    timeout=60,
                )
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"]

                # Parse JSON response
                fix_info = json.loads(content)

                if fix_info.get("fix_type") == "no_fix" or fix_info.get(
                    "confidence", 0
                ) < 0.5:
                    return None

                return ETLFix(
                    description=fix_info["diagnosis"],
                    suggestion=fix_info["suggestion"],
                    confidence=fix_info["confidence"],
                )
        except Exception as e:
            logger.error(f"LLM request failed: {e}")
            return None

    def get_error_statistics(self) -> dict[str, Any]:
        """Get statistics about ETL errors."""
        error_types = {}
        for error in self.error_history:
            error_types[error.error_type] = error_types.get(error.error_type, 0) + 1

        return {
            "total_errors": len(self.error_history),
            "error_types": error_types,
            "recent_errors": [
                {
                    "script": e.script_name,
                    "type": e.error_type,
                    "time": e.timestamp,
                }
                for e in self.error_history[-10:]
            ],
        }


class ETLFix:
    """Represents a suggested fix for an ETL error."""

    def __init__(self, description: str, suggestion: str, confidence: float):
        self.description = description
        self.suggestion = suggestion
        self.confidence = confidence


# Convenience function
async def run_etl_safe(
    script_path: Path,
    input_data: bytes,
    script_type: str = "python",
    **kwargs,
) -> dict[str, Any]:
    """
    Run ETL script with self-healing.

    Usage:
        result = await run_etl_safe(
            Path("gmlh2geojson.js"),
            file_content,
            script_type="node"
        )
        if result["success"]:
            process(result["output"])
    """
    healer = SelfHealingETL(**kwargs)
    return await healer.run_with_healing(script_path, input_data, script_type)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Self-Healing ETL Runner")
    parser.add_argument("script", type=Path, help="ETL script to run")
    parser.add_argument("input", type=Path, help="Input file")
    parser.add_argument("--type", default="python", help="Script type")
    parser.add_argument("--llm", default="http://localhost:11434/v1", help="LLM endpoint")

    args = parser.parse_args()

    input_data = args.input.read_bytes()

    result = asyncio.run(
        run_etl_safe(
            args.script, input_data, args.type, llm_endpoint=args.llm
        )
    )

    print(json.dumps(result, indent=2))
