declare module '*.svg' {
    const content: string;
    export default content;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.jpg' {
    const content: string;
    export default content;
}

declare module '*.jpeg' {
    const content: string;
    export default content;
}

declare module '*.gif' {
    const content: string;
    export default content;
}

declare module '*.webp' {
    const content: string;
    export default content;
}

declare module '*.json' {
    const content: any;
    export default content;
}

declare module 'dat.gui' {
    export class GUI {
        constructor();
        add(obj: any, property: string): any;
        addFolder(name: string): GUI;
    }
}
