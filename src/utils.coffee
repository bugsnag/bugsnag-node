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
			return packageInfo.version || "unknown"
		catch e
			return "unknown"

	@fullPath: (unknownPath) ->
		if unknownPath.indexOf(path.sep) == 0 then unknownPath else path.join(__dirname, unknownPath)

	@cloneObject: (obj) ->
    return obj unless obj && @typeOf(obj) == "object"
    copy = obj.constructor()
    
    for key in Object.keys(obj)
      if obj.hasOwnProperty key
      	if @typeOf(obj[key]) == "object"
      		copy[key] = @cloneObject obj[key]
      	else
      		copy[key] = obj[key]
    return copy

  @mergeObjects: (dest, source) ->
    return dest unless dest && @typeOf(dest) == "object" && source && @typeOf(source) == "object"

    for key in Object.keys(source)
      if source.hasOwnProperty key
        if @typeOf(source[key]) == "object" && dest[key]
          @mergeObjects dest[key], source[key]
        else
          dest[key] = source[key]
    return dest

  @filterObject: (object, filters) ->
    return unless Utils.typeOf object == "object"
    Object.keys(object).forEach (key) =>
      if object.hasOwnProperty key
        filters.forEach (filter) =>
          if key.indexOf(filter) != -1
            object[key] = "[FILTERED]"
          else if @typeOf(object[key]) == "object"
            @filterObject object[key], filters