"""Enable Row-Level Security on Geometry and Source tables

Revision ID: 002
Revises: 001
Create Date: 2024-01-15

This migration implements Row-Level Security (RLS) on the core database tables
to ensure strict data isolation between users/tenants. RLS provides defense-in-depth
by enforcing access control at the database level, regardless of application logic.

Security Benefits:
- Prevents unauthorized data access at the database level
- Protects against application-level bugs exposing data
- Ensures multi-tenant isolation even with compromised app code
- Complies with data protection regulations (GDPR, SOC2)

Implementation Strategy:
1. Enable RLS on target tables
2. Create policies for user isolation
3. Add session context variables for application-level user injection
4. Create indexes to maintain performance with RLS enabled
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine import Connection

# revision identifiers
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Enable Row-Level Security on core tables.

    This creates database-level security policies that ensure users can only
    access their own data, regardless of application logic.
    """
    connection: Connection = op.get_bind()

    # Enable RLS on the geometry table
    # This ensures all operations on the geometry table are subject to RLS policies
    op.execute(sa.text("ALTER TABLE geometry ENABLE ROW LEVEL SECURITY"))

    # Enable RLS on the source table
    op.execute(sa.text("ALTER TABLE source ENABLE ROW LEVEL SECURITY"))

    # Enable RLS on the project table
    op.execute(sa.text("ALTER TABLE project ENABLE ROW LEVEL SECURITY"))

    # Enable RLS on the layer table
    op.execute(sa.text("ALTER TABLE layer ENABLE ROW LEVEL SECURITY"))

    # Create policy for user isolation on geometry table
    # This policy ensures users can only access their own geometries
    op.execute(sa.text("""
        CREATE POLICY user_isolation_geometry ON geometry
        FOR ALL
        USING (owner_id = current_setting('app.current_user_id', true)::uuid)
        WITH CHECK (owner_id = current_setting('app.current_user_id', true)::uuid)
    """))

    # Create policy for user isolation on source table
    op.execute(sa.text("""
        CREATE POLICY user_isolation_source ON source
        FOR ALL
        USING (owner_id = current_setting('app.current_user_id', true)::uuid)
        WITH CHECK (owner_id = current_setting('app.current_user_id', true)::uuid)
    """))

    # Create policy for user isolation on project table
    op.execute(sa.text("""
        CREATE POLICY user_isolation_project ON project
        FOR ALL
        USING (owner_id = current_setting('app.current_user_id', true)::uuid)
        WITH CHECK (owner_id = current_setting('app.current_user_id', true)::uuid)
    """))

    # Create policy for user isolation on layer table
    op.execute(sa.text("""
        CREATE POLICY user_isolation_layer ON layer
        FOR ALL
        USING (owner_id = current_setting('app.current_user_id', true)::uuid)
        WITH CHECK (owner_id = current_setting('app.current_user_id', true)::uuid)
    """))

    # Create indexes to maintain query performance with RLS
    # These indexes help the query planner optimize RLS-enabled queries
    op.execute(sa.text("""
        CREATE INDEX IF NOT EXISTS geometry_owner_id_idx
        ON geometry(owner_id)
    """))

    op.execute(sa.text("""
        CREATE INDEX IF NOT EXISTS source_owner_id_idx
        ON source(owner_id)
    """))

    op.execute(sa.text("""
        CREATE INDEX IF NOT EXISTS project_owner_id_idx
        ON project(owner_id)
    """))

    op.execute(sa.text("""
        CREATE INDEX IF NOT EXISTS layer_owner_id_idx
        ON layer(owner_id)
    """))

    # Create a function to set the current user context
    # This will be called by the application before executing queries
    op.execute(sa.text("""
        CREATE OR REPLACE FUNCTION set_app_context(user_id uuid)
        RETURNS void AS $$
        BEGIN
            PERFORM set_config('app.current_user_id', user_id::text, false);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    """))

    # Create a function to clear the current user context
    # This should be called after request processing completes
    op.execute(sa.text("""
        CREATE OR REPLACE FUNCTION clear_app_context()
        RETURNS void AS $$
        BEGIN
            PERFORM set_config('app.current_user_id', null, true);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    """))

    # Grant execute permission on context functions to application role
    # Adjust the role name as needed for your deployment
    op.execute(sa.text("GRANT EXECUTE ON FUNCTION set_app_context(uuid) TO api_user"))
    op.execute(sa.text("GRANT EXECUTE ON FUNCTION clear_app_context() TO api_user"))


def downgrade() -> None:
    """
    Remove Row-Level Security from core tables.

    This reverts the RLS policies and context functions created in the upgrade.
    Use with caution as this removes database-level security protections.
    """
    connection: Connection = op.get_bind()

    # Drop RLS policies
    op.execute(sa.text("DROP POLICY IF EXISTS user_isolation_geometry ON geometry"))
    op.execute(sa.text("DROP POLICY IF EXISTS user_isolation_source ON source"))
    op.execute(sa.text("DROP POLICY IF EXISTS user_isolation_project ON project"))
    op.execute(sa.text("DROP POLICY IF EXISTS user_isolation_layer ON layer"))

    # Disable RLS on tables
    op.execute(sa.text("ALTER TABLE geometry DISABLE ROW LEVEL SECURITY"))
    op.execute(sa.text("ALTER TABLE source DISABLE ROW LEVEL SECURITY"))
    op.execute(sa.text("ALTER TABLE project DISABLE ROW LEVEL SECURITY"))
    op.execute(sa.text("ALTER TABLE layer DISABLE ROW LEVEL SECURITY"))

    # Drop indexes
    op.execute(sa.text("DROP INDEX IF EXISTS geometry_owner_id_idx"))
    op.execute(sa.text("DROP INDEX IF EXISTS source_owner_id_idx"))
    op.execute(sa.text("DROP INDEX IF EXISTS project_owner_id_idx"))
    op.execute(sa.text("DROP INDEX IF EXISTS layer_owner_id_idx"))

    # Drop context functions
    op.execute(sa.text("DROP FUNCTION IF EXISTS set_app_context(uuid)"))
    op.execute(sa.text("DROP FUNCTION IF EXISTS clear_app_context()"))
