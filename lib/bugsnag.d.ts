// Type definitions for bugsnag-node v1.9.1
// Project: https://github.com/bugsnag/bugsnag-node
// Definitions by: Iker Pérez Brunelli <https://github.com/DarkerTV>

declare namespace bugsnag {
    interface Bugsnag {
        metaData: { [key: string]: any };
        requestData: { [key: string]: any };
        register(apiKey: string, options?: ConfigurationOptions): Bugsnag;
        configure(options: ConfigurationOptions): void;
        notify(error: string | Error, cb?: (error: Error, response: any) => void): void;
        notify(error: string | Error, options: NotifyOptions, cb?: (error: Error, response: any) => void): void;
        errorHandler: ErrorHandler;
        createErrorHandler(apiKey: string, options?: ConfigurationOptions): ErrorHandler;
        requestHandler: RequestHandler;
        createRequestHandler(apiKey: string, options?: ConfigurationOptions): RequestHandler;
        restifyHandler(req: any, res: any, route: any, err: Error): void;
        koaHandler(err: Error, ctx: any): void;
        intercept<T>(cb?: (...args: any[]) => T): (error: any, ...args: any[]) => T & void;
        autoNotify(cb: () => void): any;
        autoNotify(options: NotifyOptions, cb: () => void): any;
        shouldNotify(): boolean;
        onBeforeNotify(cb: (notification: any) => boolean | void, error?: Error): void;
    }

    interface ConfigurationOptions {
        appType?: string;
        appVersion?: string;
        autoCaptureSessions?: boolean;
        autoNotify?: boolean;
        autoNotifyUnhandledRejection?: boolean;
        endpoints?: Endpoints;
        filters?: string[];
        headers?: { [key: string]: string };
        hostname?: string;
        logger?: Logger;
        logLevel?: string;
        metaData?: { [key: string]: any };
        notifyHost?: string;
        notifyPath?: string;
        notifyPort?: number;
        notifyReleaseStages?: string[];
        onUncaughtError?(error: string | Error): void;
        packageJSON?: string;
        projectRoot?: string;
        proxy?: string;
        releaseStage?: string;
        sendCode?: boolean;
        sessionEndpoint?: string;
        useSSL?: boolean;
    }

    interface Logger {
        info(): void;
        warn(): void;
        error(): void;
        debug(): void;
    }

    interface Endpoints {
        notify: string;
        sessions?: string;
    }

    interface NotifyOptions {
        errorName?: string;
        userId?: string | number;
        user?: { [key: string]: any };
        context?: string;
        groupingHash?: string;
        severity?: 'error' | 'warning' | 'info';
        req?: { [key: string]: any };
        apiKey?: string;
        [key: string]: any;
    }

    type ErrorHandler = (err: Error | any, req: any, res: any, next: NextFunction) => void;

    type NextFunction = (err?: any) => void;

    type RequestHandler = (req: any, res: any, next: NextFunction) => any;
}

declare const bugsnag: bugsnag.Bugsnag;
export = bugsnag;
