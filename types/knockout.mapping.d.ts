import * as ko from "knockout";

declare module "knockout" {
    export module mapping {
        export type MappedObservable<T> = {
            [P in keyof T]:
            T[P] extends ko.Observable<infer E> | ko.ObservableArray<infer E> ? T[P] :
            T[P] extends string | boolean | number | Date ? ko.Observable<T[P]> :
            T[P] extends Array<infer E> ? ko.ObservableArray<MappedObservable<E>> :
            T[P] extends Function ? T[P] :
            T[P] extends object ? MappedObservable<T[P]> :
            T[P];
        };

        export type MappingOptions<T = any> = MappingOptionsBase<T> & MappingOptionsSpecific<T>;

        export interface MappingOptionsBase<T> {
            ignore?: (keyof T)[];
            include?: (keyof T)[];
            copy?: (keyof T)[];
            observe?: (keyof T)[];
            mappedProperties?: (keyof T)[];
            deferEvaluation?: boolean;
        }

        export interface MappingOptionsProperty<T> extends MappingOptionsBase<T> {
            create?: (options: CreateOptions<T>) => void;
            update?: (options: UpdateOptions<T>) => void;
            key?: (data: T) => any;
        }

        export type MappingOptionsSpecific<T> = {
            [P in keyof T]?:
            T[P] extends Array<infer U> ? MappingOptionsProperty<U> :
            MappingOptionsProperty<T[P]>;
        };

        export interface CreateOptions<T> {
            data: T;
            parent: any;
        }

        export interface UpdateOptions<T> {
            data: T;
            parent: any;
            target: any;
            observable?: ko.Observable<any>;
        }

        export interface VisitModelOptions {
            visitedObjects?: any;
            parentName?: string;
            ignore?: string[];
            copy?: string[];
            include?: string[];
        }

        /**
         * Checks if an object was created using `knockout.mapping`.
         * @param viewModel View model object to be checked.
         */
        export function isMapped(viewModel: any): boolean;

        /**
         * Updates target observable with value from the source.
         * 
         * @param source Plain JavaScript value to be mapped.
         * @param target Observable to be updated.
         */
        export function fromJS(source: string, target: ko.Observable<string>): ko.Observable<string>;
        /**
         * Creates an observable wrapping source's value. 
         * If 'target' is supplied, instead, target observable is updated.
         * 
         * @param source Plain JavaScript value to be mapped.
         * @param options The mapping options.
         * @param target Observable to be updated.
         */
        export function fromJS(source: string, inputOptions?: MappingOptions<string>, target?: ko.Observable<string>): ko.Observable<string>;

        /**
         * Updates target observable with value from the source.
         * 
         * @param source Plain JavaScript value to be mapped.
         * @param target Observable to be updated.
         */
        export function fromJS(source: number, target: ko.Observable<number>): ko.Observable<number>;
        /**
         * Creates an observable wrapping source's value. 
         * If 'target' is supplied, instead, target observable is updated.
         * 
         * @param source Plain JavaScript value to be mapped.
         * @param options The mapping options.
         * @param target Observable to be updated.
         */
        export function fromJS(source: number, inputOptions?: MappingOptions<number>, target?: ko.Observable<number>): ko.Observable<number>;

        /**
         * Updates target observable with value from the source.
         * 
         * @param source Plain JavaScript value to be mapped.
         * @param target Observable to be updated.
         */
        export function fromJS(source: boolean, target: ko.Observable<boolean>): ko.Observable<boolean>;
        /**
         * Creates an observable wrapping source's value. 
         * If 'target' is supplied, instead, target observable is updated.
         * 
         * @param source Plain JavaScript value to be mapped.
         * @param options The mapping options.
         * @param target Observable to be updated.
         */
        export function fromJS(source: boolean, inputOptions?: MappingOptions<boolean>, target?: ko.Observable<boolean>): ko.Observable<boolean>;

        /**
         * Creates a view model object with observable properties for each of the properties on the source. 
         * 
         * @param source Plain JavaScript array to be mapped.
         */
        export function fromJS<SourceT = any>(source: SourceT[]): ko.ObservableArray<MappedObservable<SourceT>>;

        /**
         * Creates a view model object with observable properties for each of the properties on the source. 
         * 
         * @param source Plain JavaScript array to be mapped.
         * @param inputOptions The mappings options with no properties.
         */
        export function fromJS<SourceT = any>(source: SourceT[], inputOptions: {}): ko.ObservableArray<MappedObservable<SourceT>>;

        /**
         * Creates a view model object with observable properties for each of the properties on the source. 
         * If 'target' is supplied, instead, target's observable properties are updated.
         * 
         * @param source Plain JavaScript array to be mapped.
         * @param options The mapping options.
         * @param target View model object previously mapped to be updated.
         */
        export function fromJS<MappedT = any, SourceT = any>(source: SourceT[], inputOptions: MappingOptions<SourceT>, target?: ko.ObservableArray<MappedT>): ko.ObservableArray<MappedT>;
        /**
         * Updates target's observable properties with those of the sources.
         * 
         * @param source Plain JavaScript array to be mapped.
         * @param target View model object previously mapped to be updated.
         */
        export function fromJS<MappedT = any, SourceT = any>(source: SourceT[], target: ko.ObservableArray<MappedT>): ko.ObservableArray<MappedT>;

        /**
         * Creates a view model object with observable properties for each of the properties on the source. 
         * 
         * @param source Plain JavaScript object to be mapped.
         */
        export function fromJS<SourceT = any>(source: SourceT): MappedObservable<SourceT>;

        /**
         * Creates a view model object with observable properties for each of the properties on the source. 
         * 
         * @param source Plain JavaScript object to be mapped.
         * @param inputOptions The mappings options with no properties.
         */
        export function fromJS<SourceT = any>(source: SourceT, inputOptions: {}): MappedObservable<SourceT>;

        /**
         * Creates a view model object with observable properties for each of the properties on the source. 
         * If 'target' is supplied, instead, target's observable properties are updated.
         * 
         * @param source Plain JavaScript object to be mapped.
         * @param options The mapping options.
         * @param target View model object previously mapped to be updated.
         */
        export function fromJS<MappedT = any, SourceT = any>(source: SourceT, inputOptions: MappingOptions<SourceT>, target?: MappedT): MappedT;
        /**
         * Updates target's observable properties with those of the sources.
         * 
         * @param source Plain JavaScript object to be mapped.
         * @param target View model object previously mapped to be updated.
         */
        export function fromJS<MappedT = any, SourceT = any>(source: SourceT, target: MappedT): MappedT;

        /**
         * Creates a view model object with observable properties for each of the properties on the source. 
         * If 'target' is supplied, instead, target's observable properties are updated.
         * 
         * @param jsonString JSON of a JavaScript object to be mapped.
         * @param options Options on mapping behavior.
         * @param target View model object previosly mapped to be updated.
         */
        export function fromJSON<MappedT = any, SourceT = any>(jsonString: string, inputOptions?: MappingOptions<SourceT>, target?: MappedT): MappedT;
        /**
         * Updates target's observable properties with those of the sources.
         * 
         * @param jsonString JSON of a JavaScript object to be mapped.
         * @param target View model object previously mapped to be updated.
         */
        export function fromJSON<MappedT = any, SourceT = any>(jsonString: string, target: MappedT): MappedT;

        /**
         * Creates an unmapped object containing only the properties of the mapped object that were part of your original JS object. 
         * 
         * @param rootObject Object with observables to be converted.
         * @param options The mapping options
         */
        export function toJS<SourceT = any, MappedT = any>(rootObject: MappedT, options?: MappingOptions<SourceT>): SourceT;

        /**
         * Creates an unmapped object containing only the properties of the mapped object that were part of your original JS object.
         * Stringify the result.
         * 
         * @param rootObject Object with observables to be converted.
         * @param options The mapping options.
         * @param replacer Same as JSON.stringify
         * @param space Sam as JSON.stringify
         */
        export function toJSON<SourceT = any>(rootObject: SourceT, options?: MappingOptions<SourceT>, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string;

        /** Get the default mapping options. */
        export function defaultOptions(): MappingOptions;
        /**
         * Sets the default mapping options.
         * 
         * @param options The new default options.
         */
        export function defaultOptions(options: MappingOptions): void;

        /** Undocumented. Reset Mapping default options to the original ones. */
        export function resetDefaultOptions(): void;

        /**
         * Undocumented. Custom implementation of JavaScript's typeof.
         * 
         * @param x Object to check type.
         */
        export function getType(x: any): string;

        /**
         * Undocumented. Visit an object and executes callback on each properties.
         * 
         * @param rootObject The root object to visit.
         * @param callback The callback which is executed on each properties.
         * @param options The options for the visiting.
         */
        export function visitModel<T = any>(rootObject: Object, callback: (propertyValue: any, parentName: string) => any, options?: VisitModelOptions): T;
    }

    export interface ObservableArrayFunctions<T> {
        mappedCreate(item: T): T;

        mappedRemove(item: T): T[];
        mappedRemove(removeFunction: (item: T) => boolean): T[];

        mappedRemoveAll(): T[];
        mappedRemoveAll(items: T[]): T[];

        mappedDestroy(item: T): void;
        mappedDestroy(destroyFunction: (item: T) => boolean): void;

        mappedDestroyAll(): void;
        mappedDestroyAll(items: T[]): void;
    }
}

export = ko.mapping;
