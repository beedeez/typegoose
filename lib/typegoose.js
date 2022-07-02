"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Passthrough = exports.getDiscriminatorModelForClass = exports.deleteModelWithClass = exports.deleteModel = exports.addModelToTypegoose = exports.buildSchema = exports.getModelWithString = exports.getModelForClass = exports.PropType = exports.Severity = exports.getName = exports.getClass = exports.getClassForDocument = exports.types = exports.errors = exports.defaultClasses = exports.LogLevels = exports.setLogLevel = exports.setGlobalOptions = exports.mongoose = void 0;
const tslib_1 = require("tslib");
/* imports */
const mongoose = require("mongoose");
exports.mongoose = mongoose;
require("reflect-metadata");
const semver = require("semver");
const utils_1 = require("./internal/utils");
/* istanbul ignore next */
if (!(0, utils_1.isNullOrUndefined)(process === null || process === void 0 ? void 0 : process.version) && !(0, utils_1.isNullOrUndefined)(mongoose === null || mongoose === void 0 ? void 0 : mongoose.version)) {
    // for usage on client side
    /* istanbul ignore next */
    if (semver.lt(mongoose === null || mongoose === void 0 ? void 0 : mongoose.version, '6.4.2')) {
        throw new Error(`Please use mongoose 6.4.2 or higher (Current mongoose: ${mongoose.version}) [E001]`);
    }
}
const globalOptions_1 = require("./globalOptions");
Object.defineProperty(exports, "setGlobalOptions", { enumerable: true, get: function () { return globalOptions_1.setGlobalOptions; } });
const constants_1 = require("./internal/constants");
const data_1 = require("./internal/data");
const schema_1 = require("./internal/schema");
const logSettings_1 = require("./logSettings");
const typeguards_1 = require("./typeguards");
const errors_1 = require("./internal/errors");
var logSettings_2 = require("./logSettings");
Object.defineProperty(exports, "setLogLevel", { enumerable: true, get: function () { return logSettings_2.setLogLevel; } });
Object.defineProperty(exports, "LogLevels", { enumerable: true, get: function () { return logSettings_2.LogLevels; } });
(0, tslib_1.__exportStar)(require("./prop"), exports);
(0, tslib_1.__exportStar)(require("./hooks"), exports);
(0, tslib_1.__exportStar)(require("./plugin"), exports);
(0, tslib_1.__exportStar)(require("./index"), exports);
(0, tslib_1.__exportStar)(require("./modelOptions"), exports);
(0, tslib_1.__exportStar)(require("./queryMethod"), exports);
(0, tslib_1.__exportStar)(require("./typeguards"), exports);
exports.defaultClasses = require("./defaultClasses");
exports.errors = require("./internal/errors");
exports.types = require("./types");
var utils_2 = require("./internal/utils");
Object.defineProperty(exports, "getClassForDocument", { enumerable: true, get: function () { return utils_2.getClassForDocument; } });
Object.defineProperty(exports, "getClass", { enumerable: true, get: function () { return utils_2.getClass; } });
Object.defineProperty(exports, "getName", { enumerable: true, get: function () { return utils_2.getName; } });
var constants_2 = require("./internal/constants");
Object.defineProperty(exports, "Severity", { enumerable: true, get: function () { return constants_2.Severity; } });
Object.defineProperty(exports, "PropType", { enumerable: true, get: function () { return constants_2.PropType; } });
(0, globalOptions_1.parseENV)(); // call this before anything to ensure they are applied
/**
 * Build a Model From a Class
 * @param cl The Class to build a Model from
 * @param options Overwrite SchemaOptions (Merged with Decorator)
 * @returns The finished Model
 * @public
 * @example
 * ```ts
 * class ClassName {}
 *
 * const NameModel = getModelForClass(ClassName);
 * ```
 */
function getModelForClass(cl, options) {
    var _a, _b, _c, _d, _e, _f;
    (0, utils_1.assertionIsClass)(cl);
    const rawOptions = typeof options === 'object' ? options : {};
    const mergedOptions = (0, utils_1.mergeMetadata)(constants_1.DecoratorKeys.ModelOptions, rawOptions, cl);
    const name = (0, utils_1.getName)(cl, rawOptions); // use "rawOptions" instead of "mergedOptions" to consistently differentiate between classes & models
    if (data_1.models.has(name)) {
        return data_1.models.get(name);
    }
    const model = (_d = (_b = (_a = mergedOptions === null || mergedOptions === void 0 ? void 0 : mergedOptions.existingConnection) === null || _a === void 0 ? void 0 : _a.model.bind(mergedOptions.existingConnection)) !== null && _b !== void 0 ? _b : (_c = mergedOptions === null || mergedOptions === void 0 ? void 0 : mergedOptions.existingMongoose) === null || _c === void 0 ? void 0 : _c.model.bind(mergedOptions.existingMongoose)) !== null && _d !== void 0 ? _d : mongoose.model.bind(mongoose);
    const compiledmodel = model(name, buildSchema(cl, mergedOptions.schemaOptions, rawOptions));
    const refetchedOptions = (_e = Reflect.getMetadata(constants_1.DecoratorKeys.ModelOptions, cl)) !== null && _e !== void 0 ? _e : {};
    if ((_f = refetchedOptions === null || refetchedOptions === void 0 ? void 0 : refetchedOptions.options) === null || _f === void 0 ? void 0 : _f.runSyncIndexes) {
        // no async/await, to wait for execution on connection in the background
        compiledmodel.syncIndexes();
    }
    return addModelToTypegoose(compiledmodel, cl, {
        existingMongoose: mergedOptions === null || mergedOptions === void 0 ? void 0 : mergedOptions.existingMongoose,
        existingConnection: mergedOptions === null || mergedOptions === void 0 ? void 0 : mergedOptions.existingConnection,
    });
}
exports.getModelForClass = getModelForClass;
/**
 * Get Model from internal cache
 * @param key Model's name key
 * @example
 * ```ts
 * class ClassName {}
 * getModelForClass(ClassName); // build the model
 * const NameModel = getModelWithString<typeof ClassName>("ClassName");
 * ```
 */
function getModelWithString(key) {
    (0, utils_1.assertion)(typeof key === 'string', () => new errors_1.ExpectedTypeError('key', 'string', key));
    return data_1.models.get(key);
}
exports.getModelWithString = getModelWithString;
/**
 * Generates a Mongoose schema out of class props, iterating through all parents
 * @param cl The Class to build a Schema from
 * @param options Overwrite SchemaOptions (Merged with Decorator)
 * @param overwriteOptions Overwrite ModelOptions (aside from schemaOptions) (Not Merged with Decorator)
 * @returns Returns the Build Schema
 * @example
 * ```ts
 * class ClassName {}
 * const NameSchema = buildSchema(ClassName);
 * const NameModel = mongoose.model("Name", NameSchema);
 * ```
 */
function buildSchema(cl, options, overwriteOptions) {
    (0, utils_1.assertionIsClass)(cl);
    logSettings_1.logger.debug('buildSchema called for "%s"', (0, utils_1.getName)(cl, overwriteOptions));
    const mergedOptions = (0, utils_1.mergeSchemaOptions)(options, cl);
    let sch = undefined;
    /** Parent Constructor */
    let parentCtor = Object.getPrototypeOf(cl.prototype).constructor;
    /* This array is to execute from lowest class to highest (when extending) */
    const parentClasses = [];
    // iterate trough all parents
    while ((parentCtor === null || parentCtor === void 0 ? void 0 : parentCtor.name) !== 'Object') {
        // add lower classes (when extending) to the front of the arrray to be processed first
        parentClasses.unshift(parentCtor);
        // set next parent
        parentCtor = Object.getPrototypeOf(parentCtor.prototype).constructor;
    }
    // iterate and build class schemas from lowest to highest (when extending classes, the lower class will get build first) see https://github.com/typegoose/typegoose/pull/243
    for (const parentClass of parentClasses) {
        // extend schema
        sch = (0, schema_1._buildSchema)(parentClass, sch, mergedOptions, false);
    }
    // get schema of current model
    sch = (0, schema_1._buildSchema)(cl, sch, mergedOptions, true, overwriteOptions);
    return sch;
}
exports.buildSchema = buildSchema;
/**
 * Add a Class-Model Pair to the Typegoose Cache
 * This can be used to add custom Models to Typegoose, with the type information of "cl"
 * Note: no gurantee that the type information is fully correct when used manually
 * @param model The Model to store
 * @param cl The Class to store
 * @param options Overwrite existingMongoose or existingConnection
 * @example
 * ```ts
 * class ClassName {}
 *
 * const schema = buildSchema(ClassName);
 * // modifications to the schame can be done
 * const model = addModelToTypegoose(mongoose.model("Name", schema), ClassName);
 * ```
 */
function addModelToTypegoose(model, cl, options) {
    var _a, _b, _c;
    const mongooseModel = ((_a = options === null || options === void 0 ? void 0 : options.existingMongoose) === null || _a === void 0 ? void 0 : _a.Model) || ((_c = (_b = options === null || options === void 0 ? void 0 : options.existingConnection) === null || _b === void 0 ? void 0 : _b.base) === null || _c === void 0 ? void 0 : _c.Model) || mongoose.Model;
    (0, utils_1.assertion)(model.prototype instanceof mongooseModel, new errors_1.NotValidModelError(model, 'addModelToTypegoose.model'));
    (0, utils_1.assertionIsClass)(cl);
    const name = model.modelName;
    (0, utils_1.assertion)(!data_1.models.has(name), new errors_1.FunctionCalledMoreThanSupportedError('addModelToTypegoose', 1, `This was caused because the model name "${name}" already exists in the typegoose-internal "models" cache`));
    if (data_1.constructors.get(name)) {
        logSettings_1.logger.info('Class "%s" already existed in the constructors Map', name);
    }
    data_1.models.set(name, model);
    data_1.constructors.set(name, cl);
    return data_1.models.get(name);
}
exports.addModelToTypegoose = addModelToTypegoose;
/**
 * Deletes a existing model so that it can be overwritten with another model
 * (deletes from mongoose.connection and typegoose models cache and typegoose constructors cache)
 * @param name The Model's mongoose name
 * @example
 * ```ts
 * class ClassName {}
 * const NameModel = getModelForClass(ClassName);
 * deleteModel("ClassName");
 * ```
 */
function deleteModel(name) {
    (0, utils_1.assertion)(typeof name === 'string', () => new errors_1.ExpectedTypeError('name', 'string', name));
    logSettings_1.logger.debug('Deleting Model "%s"', name);
    const model = data_1.models.get(name);
    if (!(0, utils_1.isNullOrUndefined)(model)) {
        model.db.deleteModel(name);
    }
    data_1.models.delete(name);
    data_1.constructors.delete(name);
}
exports.deleteModel = deleteModel;
/**
 * Delete a model, with the given class
 * Same as "deleteModel", only that it can be done with the class instead of the name
 * @param cl The Class to delete the model from
 * @example
 * ```ts
 * class ClassName {}
 * const NameModel = getModelForClass(ClassName);
 * deleteModelWithClass(ClassName);
 * ```
 */
function deleteModelWithClass(cl) {
    (0, utils_1.assertionIsClass)(cl);
    let name = (0, utils_1.getName)(cl);
    if (!data_1.models.has(name)) {
        logSettings_1.logger.debug(`Class "${name}" is not in "models", trying to find in "constructors"`);
        let found = false;
        // type "Map" does not have a "find" function, and using "get" would maybe result in the incorrect values
        for (const [cname, constructor] of data_1.constructors) {
            if (constructor === cl) {
                logSettings_1.logger.debug(`Found Class in "constructors" with class name "${name}" and entered name "${cname}""`);
                name = cname;
                found = true;
            }
        }
        if (!found) {
            logSettings_1.logger.debug(`Could not find class "${name}" in constructors`);
            return;
        }
    }
    return deleteModel(name);
}
exports.deleteModelWithClass = deleteModelWithClass;
function getDiscriminatorModelForClass(from, cl, value_or_options, options) {
    (0, utils_1.assertion)((0, typeguards_1.isModel)(from), new errors_1.NotValidModelError(from, 'getDiscriminatorModelForClass.from'));
    (0, utils_1.assertionIsClass)(cl);
    const value = typeof value_or_options === 'string' ? value_or_options : undefined;
    const rawOptions = typeof value_or_options !== 'string' ? value_or_options : typeof options === 'object' ? options : {};
    const mergedOptions = (0, utils_1.mergeMetadata)(constants_1.DecoratorKeys.ModelOptions, rawOptions, cl);
    const name = (0, utils_1.getName)(cl, rawOptions); // use "rawOptions" instead of "mergedOptions" to consistently differentiate between classes & models
    if (data_1.models.has(name)) {
        return data_1.models.get(name);
    }
    const sch = buildSchema(cl, mergedOptions.schemaOptions, rawOptions);
    const discriminatorKey = sch.get('discriminatorKey');
    if (!!discriminatorKey && sch.path(discriminatorKey)) {
        sch.paths[discriminatorKey].options.$skipDiscriminatorCheck = true;
    }
    const model = from.discriminator(name, sch, value ? value : name);
    return addModelToTypegoose(model, cl);
}
exports.getDiscriminatorModelForClass = getDiscriminatorModelForClass;
/**
 * Use this class if raw mongoose for a path is wanted
 * It is still recommended to use the typegoose classes directly
 * @see Using `Passthrough`, the paths created will also result as an `Schema` (since mongoose 6.0), see {@link https://github.com/Automattic/mongoose/issues/7181 Mongoose#7181}
 * @example
 * ```ts
 * class Dummy {
 *   @prop({ type: () => new Passthrough({ somePath: String }) })
 *   public somepath: { somePath: string };
 * }
 *
 * class Dummy {
 *   @prop({ type: () => new Passthrough({ somePath: String }, true) })
 *   public somepath: { somePath: string };
 * }
 * ```
 */
class Passthrough {
    /**
     * Use this like `new mongoose.Schema()`
     * @param raw The Schema definition
     * @param direct Directly insert "raw", instead of using "type" (this will not apply any other inner options)
     */
    constructor(raw, direct) {
        this.raw = raw;
        this.direct = direct !== null && direct !== void 0 ? direct : false;
    }
}
exports.Passthrough = Passthrough;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZWdvb3NlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3R5cGVnb29zZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsYUFBYTtBQUNiLHFDQUFxQztBQWtDNUIsNEJBQVE7QUFqQ2pCLDRCQUEwQjtBQUMxQixpQ0FBaUM7QUFDakMsNENBQThIO0FBRTlILDBCQUEwQjtBQUMxQixJQUFJLENBQUMsSUFBQSx5QkFBaUIsRUFBQyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFBLHlCQUFpQixFQUFDLFFBQVEsYUFBUixRQUFRLHVCQUFSLFFBQVEsQ0FBRSxPQUFPLENBQUMsRUFBRTtJQUNqRiwyQkFBMkI7SUFDM0IsMEJBQTBCO0lBQzFCLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLGFBQVIsUUFBUSx1QkFBUixRQUFRLENBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFO1FBQ3pDLE1BQU0sSUFBSSxLQUFLLENBQUMsMERBQTBELFFBQVEsQ0FBQyxPQUFPLFVBQVUsQ0FBQyxDQUFDO0tBQ3ZHO0NBQ0Y7QUFFRCxtREFBNkQ7QUFvQjFDLGlHQXBCQSxnQ0FBZ0IsT0FvQkE7QUFuQm5DLG9EQUFxRDtBQUNyRCwwQ0FBdUQ7QUFDdkQsOENBQWlEO0FBQ2pELCtDQUF1QztBQUN2Qyw2Q0FBdUM7QUFXdkMsOENBQWdIO0FBS2hILDZDQUF1RDtBQUE5QywwR0FBQSxXQUFXLE9BQUE7QUFBRSx3R0FBQSxTQUFTLE9BQUE7QUFDL0Isc0RBQXVCO0FBQ3ZCLHVEQUF3QjtBQUN4Qix3REFBeUI7QUFDekIsdURBQXdCO0FBQ3hCLDhEQUErQjtBQUMvQiw2REFBOEI7QUFDOUIsNERBQTZCO0FBQzdCLHFEQUFtRDtBQUNuRCw4Q0FBNEM7QUFDNUMsbUNBQWlDO0FBR2pDLDBDQUEwRTtBQUFqRSw0R0FBQSxtQkFBbUIsT0FBQTtBQUFFLGlHQUFBLFFBQVEsT0FBQTtBQUFF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