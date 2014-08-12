path = require "path"

classToType = {}

for name in "Boolean Number String Function Array Date RegExp".split(" ")
  classToType["[object " + name + "]"] = name.toLowerCase()

module.exports = class Utils
  @typeOf: (obj) ->
    if obj == undefined or obj == null
      return String obj
    myClass = Object.prototype.toString.call obj
    if myClass of classToType
      return classToType[myClass]
    return "object"

  @getPackageVersion: (packageJSONPath) ->
    try
      packageInfo = require packageJSONPath
      return packageInfo.version
    catch e
      return null

  @fullPath: (unknownPath) ->
    path.resolve(__dirname, unknownPath)

  @cloneObject: (obj, options = {}) ->
    return obj unless obj && @typeOf(obj) == "object"
    except = options.except || []
    alreadyCloned = options.alreadyCloned || []

    copy = obj.constructor()

    for key in Object.keys(obj)
      val = obj[key]
      if obj.hasOwnProperty(key) && except.indexOf(key) == -1
        if @typeOf(val) == "object"
          if alreadyCloned.indexOf(val) == -1
            alreadyCloned.push(val)
            copy[key] = @cloneObject val, alreadyCloned: alreadyCloned
        else
          copy[key] = val
    return copy

  @mergeObjects: (dest, source, options = {}) ->
    return dest unless dest && @typeOf(dest) == "object" && source && @typeOf(source) == "object"
    alreadyMerged = options.alreadyMerged || []

    for key in Object.keys(source)
      if source.hasOwnProperty key
        val = source[key]
        if @typeOf(val) == "object" && dest[key]
          if alreadyMerged.indexOf(val) == -1
            alreadyMerged.push(val)
            @mergeObjects dest[key], val, alreadyMerged: alreadyMerged
        else
          dest[key] = source[key]
    return dest

  @filterObject: (object, filters, options = {}) ->
    return unless @typeOf(object) == "object"
    return unless @typeOf(filters) == "array"
    alreadyFiltered = options.alreadyFiltered || []

    Object.keys(object).forEach (key) =>
      if object.hasOwnProperty key
        filters.forEach (filter) =>
          if key.indexOf(filter) != -1
            object[key] = "[FILTERED]"
          else if @typeOf(object[key]) == "object" && alreadyFiltered.indexOf(object[key]) == -1
            alreadyFiltered.push object[key]
            @filterObject object[key], filters, alreadyFiltered: alreadyFiltered