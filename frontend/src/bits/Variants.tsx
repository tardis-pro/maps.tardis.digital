export function Variants(): {
    style: { padding: string; fontWeight: string };
    variant1: {
        open: {
            fontSize: number;
            y: number;
            opacity: number;
            transition: { y: { stiffness: number; velocity: number } };
        };
        closed: {
            fontSize: number;
            y: number;
            opacity: number;
            transition: { y: { stiffness: number; duration: number } };
        };
    };
    variant2: {
        open: {
            fontSize: number;
            y: number;
            opacity: number;
            transition: { y: { stiffness: number; velocity: number } };
        };
        closed: {
            fontSize: number;
            y: number;
            opacity: number;
            transition: { y: { stiffness: number; duration: number } };
        };
    };
    staggering: {
        open: {
            transition: { staggerChildren: number; delayChildren: number };
        };
    };
    title: {
        padding: string;
        /* top | right | bottom | left */ /* top | right | bottom | left */ opacity: number;
    };
} {
    const variant1 = {
        open: {
            fontSize: 10,
            y: -30,
            opacity: 0.5,
            transition: {
                y: { stiffness: 1000, velocity: -100 },
            },
        },
        closed: {
            fontSize: 3,
            y: 0,
            opacity: 0,
            transition: { y: { stiffness: 1000, duration: 0.5 } },
        },
    };

    const variant2 = {
        open: {
            fontSize: 10,
            y: -90,
            opacity: 1,
            transition: {
                y: { stiffness: 1000, velocity: -100 },
            },
        },
        closed: {
            fontSize: 3,
            y: 0,
            opacity: 0,
            transition: { y: { stiffness: 1000, duration: 0.5 } },
        },
    };

    const staggering = {
        open: {
            transition: { staggerChildren: 0.07, delayChildren: 0.2 },
        },
    };

    const style = {
        padding: '1.5em 0.97em',
        fontWeight: 'normal',
    };

    const title = {
        padding: '1.5rem' /* top | right | bottom | left */,
        opacity: 1,
    };
    return { style, variant1, variant2, staggering, title };
}
