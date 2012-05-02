var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var or__3548__auto____25048 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3548__auto____25048)) {
    return or__3548__auto____25048
  }else {
    var or__3548__auto____25049 = p["_"];
    if(cljs.core.truth_(or__3548__auto____25049)) {
      return or__3548__auto____25049
    }else {
      return false
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error.call(null, "No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.aget = function aget(array, i) {
  return array[i]
};
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__25113 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25050 = this$;
      if(cljs.core.truth_(and__3546__auto____25050)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25050
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3548__auto____25051 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25051)) {
          return or__3548__auto____25051
        }else {
          var or__3548__auto____25052 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25052)) {
            return or__3548__auto____25052
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__25114 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25053 = this$;
      if(cljs.core.truth_(and__3546__auto____25053)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25053
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3548__auto____25054 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25054)) {
          return or__3548__auto____25054
        }else {
          var or__3548__auto____25055 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25055)) {
            return or__3548__auto____25055
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__25115 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25056 = this$;
      if(cljs.core.truth_(and__3546__auto____25056)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25056
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____25057 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25057)) {
          return or__3548__auto____25057
        }else {
          var or__3548__auto____25058 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25058)) {
            return or__3548__auto____25058
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__25116 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25059 = this$;
      if(cljs.core.truth_(and__3546__auto____25059)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25059
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____25060 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25060)) {
          return or__3548__auto____25060
        }else {
          var or__3548__auto____25061 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25061)) {
            return or__3548__auto____25061
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__25117 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25062 = this$;
      if(cljs.core.truth_(and__3546__auto____25062)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25062
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____25063 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25063)) {
          return or__3548__auto____25063
        }else {
          var or__3548__auto____25064 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25064)) {
            return or__3548__auto____25064
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__25118 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25065 = this$;
      if(cljs.core.truth_(and__3546__auto____25065)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25065
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____25066 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25066)) {
          return or__3548__auto____25066
        }else {
          var or__3548__auto____25067 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25067)) {
            return or__3548__auto____25067
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__25119 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25068 = this$;
      if(cljs.core.truth_(and__3546__auto____25068)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25068
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____25069 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25069)) {
          return or__3548__auto____25069
        }else {
          var or__3548__auto____25070 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25070)) {
            return or__3548__auto____25070
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__25120 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25071 = this$;
      if(cljs.core.truth_(and__3546__auto____25071)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25071
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____25072 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25072)) {
          return or__3548__auto____25072
        }else {
          var or__3548__auto____25073 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25073)) {
            return or__3548__auto____25073
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__25121 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25074 = this$;
      if(cljs.core.truth_(and__3546__auto____25074)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25074
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____25075 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25075)) {
          return or__3548__auto____25075
        }else {
          var or__3548__auto____25076 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25076)) {
            return or__3548__auto____25076
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__25122 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25077 = this$;
      if(cljs.core.truth_(and__3546__auto____25077)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25077
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____25078 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25078)) {
          return or__3548__auto____25078
        }else {
          var or__3548__auto____25079 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25079)) {
            return or__3548__auto____25079
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__25123 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25080 = this$;
      if(cljs.core.truth_(and__3546__auto____25080)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25080
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____25081 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25081)) {
          return or__3548__auto____25081
        }else {
          var or__3548__auto____25082 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25082)) {
            return or__3548__auto____25082
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__25124 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25083 = this$;
      if(cljs.core.truth_(and__3546__auto____25083)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25083
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____25084 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25084)) {
          return or__3548__auto____25084
        }else {
          var or__3548__auto____25085 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25085)) {
            return or__3548__auto____25085
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__25125 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25086 = this$;
      if(cljs.core.truth_(and__3546__auto____25086)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25086
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____25087 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25087)) {
          return or__3548__auto____25087
        }else {
          var or__3548__auto____25088 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25088)) {
            return or__3548__auto____25088
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__25126 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25089 = this$;
      if(cljs.core.truth_(and__3546__auto____25089)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25089
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____25090 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25090)) {
          return or__3548__auto____25090
        }else {
          var or__3548__auto____25091 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25091)) {
            return or__3548__auto____25091
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__25127 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25092 = this$;
      if(cljs.core.truth_(and__3546__auto____25092)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25092
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____25093 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25093)) {
          return or__3548__auto____25093
        }else {
          var or__3548__auto____25094 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25094)) {
            return or__3548__auto____25094
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__25128 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25095 = this$;
      if(cljs.core.truth_(and__3546__auto____25095)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25095
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____25096 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25096)) {
          return or__3548__auto____25096
        }else {
          var or__3548__auto____25097 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25097)) {
            return or__3548__auto____25097
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__25129 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25098 = this$;
      if(cljs.core.truth_(and__3546__auto____25098)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25098
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____25099 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25099)) {
          return or__3548__auto____25099
        }else {
          var or__3548__auto____25100 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25100)) {
            return or__3548__auto____25100
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__25130 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25101 = this$;
      if(cljs.core.truth_(and__3546__auto____25101)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25101
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____25102 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25102)) {
          return or__3548__auto____25102
        }else {
          var or__3548__auto____25103 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25103)) {
            return or__3548__auto____25103
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__25131 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25104 = this$;
      if(cljs.core.truth_(and__3546__auto____25104)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25104
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____25105 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25105)) {
          return or__3548__auto____25105
        }else {
          var or__3548__auto____25106 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25106)) {
            return or__3548__auto____25106
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__25132 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25107 = this$;
      if(cljs.core.truth_(and__3546__auto____25107)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25107
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____25108 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25108)) {
          return or__3548__auto____25108
        }else {
          var or__3548__auto____25109 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25109)) {
            return or__3548__auto____25109
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__25133 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25110 = this$;
      if(cljs.core.truth_(and__3546__auto____25110)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____25110
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____25111 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____25111)) {
          return or__3548__auto____25111
        }else {
          var or__3548__auto____25112 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____25112)) {
            return or__3548__auto____25112
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__25113.call(this, this$);
      case 2:
        return _invoke__25114.call(this, this$, a);
      case 3:
        return _invoke__25115.call(this, this$, a, b);
      case 4:
        return _invoke__25116.call(this, this$, a, b, c);
      case 5:
        return _invoke__25117.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__25118.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__25119.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__25120.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__25121.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__25122.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__25123.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__25124.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__25125.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__25126.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__25127.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__25128.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__25129.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__25130.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__25131.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__25132.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__25133.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25135 = coll;
    if(cljs.core.truth_(and__3546__auto____25135)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3546__auto____25135
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3548__auto____25136 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____25136)) {
        return or__3548__auto____25136
      }else {
        var or__3548__auto____25137 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3548__auto____25137)) {
          return or__3548__auto____25137
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25138 = coll;
    if(cljs.core.truth_(and__3546__auto____25138)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3546__auto____25138
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3548__auto____25139 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____25139)) {
        return or__3548__auto____25139
      }else {
        var or__3548__auto____25140 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3548__auto____25140)) {
          return or__3548__auto____25140
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25141 = coll;
    if(cljs.core.truth_(and__3546__auto____25141)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3546__auto____25141
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3548__auto____25142 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____25142)) {
        return or__3548__auto____25142
      }else {
        var or__3548__auto____25143 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3548__auto____25143)) {
          return or__3548__auto____25143
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__25150 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25144 = coll;
      if(cljs.core.truth_(and__3546__auto____25144)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____25144
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3548__auto____25145 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____25145)) {
          return or__3548__auto____25145
        }else {
          var or__3548__auto____25146 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____25146)) {
            return or__3548__auto____25146
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__25151 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25147 = coll;
      if(cljs.core.truth_(and__3546__auto____25147)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____25147
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____25148 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____25148)) {
          return or__3548__auto____25148
        }else {
          var or__3548__auto____25149 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____25149)) {
            return or__3548__auto____25149
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__25150.call(this, coll, n);
      case 3:
        return _nth__25151.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25153 = coll;
    if(cljs.core.truth_(and__3546__auto____25153)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3546__auto____25153
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3548__auto____25154 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____25154)) {
        return or__3548__auto____25154
      }else {
        var or__3548__auto____25155 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3548__auto____25155)) {
          return or__3548__auto____25155
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25156 = coll;
    if(cljs.core.truth_(and__3546__auto____25156)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3546__auto____25156
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3548__auto____25157 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____25157)) {
        return or__3548__auto____25157
      }else {
        var or__3548__auto____25158 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3548__auto____25158)) {
          return or__3548__auto____25158
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__25165 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25159 = o;
      if(cljs.core.truth_(and__3546__auto____25159)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____25159
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3548__auto____25160 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____25160)) {
          return or__3548__auto____25160
        }else {
          var or__3548__auto____25161 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____25161)) {
            return or__3548__auto____25161
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__25166 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25162 = o;
      if(cljs.core.truth_(and__3546__auto____25162)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____25162
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____25163 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____25163)) {
          return or__3548__auto____25163
        }else {
          var or__3548__auto____25164 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____25164)) {
            return or__3548__auto____25164
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__25165.call(this, o, k);
      case 3:
        return _lookup__25166.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25168 = coll;
    if(cljs.core.truth_(and__3546__auto____25168)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3546__auto____25168
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3548__auto____25169 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____25169)) {
        return or__3548__auto____25169
      }else {
        var or__3548__auto____25170 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____25170)) {
          return or__3548__auto____25170
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25171 = coll;
    if(cljs.core.truth_(and__3546__auto____25171)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3546__auto____25171
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____25172 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____25172)) {
        return or__3548__auto____25172
      }else {
        var or__3548__auto____25173 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3548__auto____25173)) {
          return or__3548__auto____25173
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25174 = coll;
    if(cljs.core.truth_(and__3546__auto____25174)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3546__auto____25174
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3548__auto____25175 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____25175)) {
        return or__3548__auto____25175
      }else {
        var or__3548__auto____25176 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3548__auto____25176)) {
          return or__3548__auto____25176
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25177 = coll;
    if(cljs.core.truth_(and__3546__auto____25177)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3546__auto____25177
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3548__auto____25178 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____25178)) {
        return or__3548__auto____25178
      }else {
        var or__3548__auto____25179 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3548__auto____25179)) {
          return or__3548__auto____25179
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25180 = coll;
    if(cljs.core.truth_(and__3546__auto____25180)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3546__auto____25180
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3548__auto____25181 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____25181)) {
        return or__3548__auto____25181
      }else {
        var or__3548__auto____25182 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3548__auto____25182)) {
          return or__3548__auto____25182
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25183 = coll;
    if(cljs.core.truth_(and__3546__auto____25183)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3546__auto____25183
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3548__auto____25184 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____25184)) {
        return or__3548__auto____25184
      }else {
        var or__3548__auto____25185 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3548__auto____25185)) {
          return or__3548__auto____25185
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25186 = coll;
    if(cljs.core.truth_(and__3546__auto____25186)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3546__auto____25186
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____25187 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____25187)) {
        return or__3548__auto____25187
      }else {
        var or__3548__auto____25188 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3548__auto____25188)) {
          return or__3548__auto____25188
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25189 = o;
    if(cljs.core.truth_(and__3546__auto____25189)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3546__auto____25189
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3548__auto____25190 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____25190)) {
        return or__3548__auto____25190
      }else {
        var or__3548__auto____25191 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3548__auto____25191)) {
          return or__3548__auto____25191
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25192 = o;
    if(cljs.core.truth_(and__3546__auto____25192)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3546__auto____25192
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____25193 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____25193)) {
        return or__3548__auto____25193
      }else {
        var or__3548__auto____25194 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3548__auto____25194)) {
          return or__3548__auto____25194
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25195 = o;
    if(cljs.core.truth_(and__3546__auto____25195)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3546__auto____25195
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3548__auto____25196 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____25196)) {
        return or__3548__auto____25196
      }else {
        var or__3548__auto____25197 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3548__auto____25197)) {
          return or__3548__auto____25197
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25198 = o;
    if(cljs.core.truth_(and__3546__auto____25198)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3546__auto____25198
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3548__auto____25199 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____25199)) {
        return or__3548__auto____25199
      }else {
        var or__3548__auto____25200 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3548__auto____25200)) {
          return or__3548__auto____25200
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__25207 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25201 = coll;
      if(cljs.core.truth_(and__3546__auto____25201)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____25201
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3548__auto____25202 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____25202)) {
          return or__3548__auto____25202
        }else {
          var or__3548__auto____25203 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____25203)) {
            return or__3548__auto____25203
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__25208 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25204 = coll;
      if(cljs.core.truth_(and__3546__auto____25204)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____25204
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____25205 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____25205)) {
          return or__3548__auto____25205
        }else {
          var or__3548__auto____25206 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____25206)) {
            return or__3548__auto____25206
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__25207.call(this, coll, f);
      case 3:
        return _reduce__25208.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25210 = o;
    if(cljs.core.truth_(and__3546__auto____25210)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3546__auto____25210
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3548__auto____25211 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____25211)) {
        return or__3548__auto____25211
      }else {
        var or__3548__auto____25212 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3548__auto____25212)) {
          return or__3548__auto____25212
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25213 = o;
    if(cljs.core.truth_(and__3546__auto____25213)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3546__auto____25213
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3548__auto____25214 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____25214)) {
        return or__3548__auto____25214
      }else {
        var or__3548__auto____25215 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3548__auto____25215)) {
          return or__3548__auto____25215
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25216 = o;
    if(cljs.core.truth_(and__3546__auto____25216)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3546__auto____25216
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3548__auto____25217 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____25217)) {
        return or__3548__auto____25217
      }else {
        var or__3548__auto____25218 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3548__auto____25218)) {
          return or__3548__auto____25218
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IRecord = {};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25219 = o;
    if(cljs.core.truth_(and__3546__auto____25219)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3546__auto____25219
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3548__auto____25220 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____25220)) {
        return or__3548__auto____25220
      }else {
        var or__3548__auto____25221 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3548__auto____25221)) {
          return or__3548__auto____25221
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25222 = d;
    if(cljs.core.truth_(and__3546__auto____25222)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3546__auto____25222
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3548__auto____25223 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3548__auto____25223)) {
        return or__3548__auto____25223
      }else {
        var or__3548__auto____25224 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____25224)) {
          return or__3548__auto____25224
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25225 = this$;
    if(cljs.core.truth_(and__3546__auto____25225)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3546__auto____25225
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____25226 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____25226)) {
        return or__3548__auto____25226
      }else {
        var or__3548__auto____25227 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3548__auto____25227)) {
          return or__3548__auto____25227
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25228 = this$;
    if(cljs.core.truth_(and__3546__auto____25228)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3546__auto____25228
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____25229 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____25229)) {
        return or__3548__auto____25229
      }else {
        var or__3548__auto____25230 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3548__auto____25230)) {
          return or__3548__auto____25230
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25231 = this$;
    if(cljs.core.truth_(and__3546__auto____25231)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3546__auto____25231
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3548__auto____25232 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____25232)) {
        return or__3548__auto____25232
      }else {
        var or__3548__auto____25233 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3548__auto____25233)) {
          return or__3548__auto____25233
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function _EQ_(x, y) {
  return cljs.core._equiv.call(null, x, y)
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x === null
};
cljs.core.type = function type(x) {
  return x.constructor
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__25234 = null;
  var G__25234__25235 = function(o, k) {
    return null
  };
  var G__25234__25236 = function(o, k, not_found) {
    return not_found
  };
  G__25234 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__25234__25235.call(this, o, k);
      case 3:
        return G__25234__25236.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25234
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__25238 = null;
  var G__25238__25239 = function(_, f) {
    return f.call(null)
  };
  var G__25238__25240 = function(_, f, start) {
    return start
  };
  G__25238 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__25238__25239.call(this, _, f);
      case 3:
        return G__25238__25240.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25238
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o === null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__25242 = null;
  var G__25242__25243 = function(_, n) {
    return null
  };
  var G__25242__25244 = function(_, n, not_found) {
    return not_found
  };
  G__25242 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__25242__25243.call(this, _, n);
      case 3:
        return G__25242__25244.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25242
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__25252 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__25246 = cljs.core._nth.call(null, cicoll, 0);
      var n__25247 = 1;
      while(true) {
        if(cljs.core.truth_(n__25247 < cljs.core._count.call(null, cicoll))) {
          var G__25256 = f.call(null, val__25246, cljs.core._nth.call(null, cicoll, n__25247));
          var G__25257 = n__25247 + 1;
          val__25246 = G__25256;
          n__25247 = G__25257;
          continue
        }else {
          return val__25246
        }
        break
      }
    }
  };
  var ci_reduce__25253 = function(cicoll, f, val) {
    var val__25248 = val;
    var n__25249 = 0;
    while(true) {
      if(cljs.core.truth_(n__25249 < cljs.core._count.call(null, cicoll))) {
        var G__25258 = f.call(null, val__25248, cljs.core._nth.call(null, cicoll, n__25249));
        var G__25259 = n__25249 + 1;
        val__25248 = G__25258;
        n__25249 = G__25259;
        continue
      }else {
        return val__25248
      }
      break
    }
  };
  var ci_reduce__25254 = function(cicoll, f, val, idx) {
    var val__25250 = val;
    var n__25251 = idx;
    while(true) {
      if(cljs.core.truth_(n__25251 < cljs.core._count.call(null, cicoll))) {
        var G__25260 = f.call(null, val__25250, cljs.core._nth.call(null, cicoll, n__25251));
        var G__25261 = n__25251 + 1;
        val__25250 = G__25260;
        n__25251 = G__25261;
        continue
      }else {
        return val__25250
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__25252.call(this, cicoll, f);
      case 3:
        return ci_reduce__25253.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__25254.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ci_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i
};
cljs.core.IndexedSeq.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__25262 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__25275 = null;
  var G__25275__25276 = function(_, f) {
    var this__25263 = this;
    return cljs.core.ci_reduce.call(null, this__25263.a, f, this__25263.a[this__25263.i], this__25263.i + 1)
  };
  var G__25275__25277 = function(_, f, start) {
    var this__25264 = this;
    return cljs.core.ci_reduce.call(null, this__25264.a, f, start, this__25264.i)
  };
  G__25275 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__25275__25276.call(this, _, f);
      case 3:
        return G__25275__25277.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25275
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__25265 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__25266 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__25279 = null;
  var G__25279__25280 = function(coll, n) {
    var this__25267 = this;
    var i__25268 = n + this__25267.i;
    if(cljs.core.truth_(i__25268 < this__25267.a.length)) {
      return this__25267.a[i__25268]
    }else {
      return null
    }
  };
  var G__25279__25281 = function(coll, n, not_found) {
    var this__25269 = this;
    var i__25270 = n + this__25269.i;
    if(cljs.core.truth_(i__25270 < this__25269.a.length)) {
      return this__25269.a[i__25270]
    }else {
      return not_found
    }
  };
  G__25279 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__25279__25280.call(this, coll, n);
      case 3:
        return G__25279__25281.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25279
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__25271 = this;
  return this__25271.a.length - this__25271.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__25272 = this;
  return this__25272.a[this__25272.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__25273 = this;
  if(cljs.core.truth_(this__25273.i + 1 < this__25273.a.length)) {
    return new cljs.core.IndexedSeq(this__25273.a, this__25273.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__25274 = this;
  return this$
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function prim_seq(prim, i) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, prim.length))) {
    return null
  }else {
    return new cljs.core.IndexedSeq(prim, i)
  }
};
cljs.core.array_seq = function array_seq(array, i) {
  return cljs.core.prim_seq.call(null, array, i)
};
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__25283 = null;
  var G__25283__25284 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__25283__25285 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__25283 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__25283__25284.call(this, array, f);
      case 3:
        return G__25283__25285.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25283
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__25287 = null;
  var G__25287__25288 = function(array, k) {
    return array[k]
  };
  var G__25287__25289 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__25287 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__25287__25288.call(this, array, k);
      case 3:
        return G__25287__25289.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25287
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__25291 = null;
  var G__25291__25292 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__25291__25293 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__25291 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__25291__25292.call(this, array, n);
      case 3:
        return G__25291__25293.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25291
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core._seq.call(null, coll)
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  var temp__3698__auto____25295 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3698__auto____25295)) {
    var s__25296 = temp__3698__auto____25295;
    return cljs.core._first.call(null, s__25296)
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  return cljs.core._rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.next = function next(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__25297 = cljs.core.next.call(null, s);
      s = G__25297;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__25298 = cljs.core.seq.call(null, x);
  var n__25299 = 0;
  while(true) {
    if(cljs.core.truth_(s__25298)) {
      var G__25300 = cljs.core.next.call(null, s__25298);
      var G__25301 = n__25299 + 1;
      s__25298 = G__25300;
      n__25299 = G__25301;
      continue
    }else {
      return n__25299
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__25302 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__25303 = function() {
    var G__25305__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__25306 = conj.call(null, coll, x);
          var G__25307 = cljs.core.first.call(null, xs);
          var G__25308 = cljs.core.next.call(null, xs);
          coll = G__25306;
          x = G__25307;
          xs = G__25308;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__25305 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25305__delegate.call(this, coll, x, xs)
    };
    G__25305.cljs$lang$maxFixedArity = 2;
    G__25305.cljs$lang$applyTo = function(arglist__25309) {
      var coll = cljs.core.first(arglist__25309);
      var x = cljs.core.first(cljs.core.next(arglist__25309));
      var xs = cljs.core.rest(cljs.core.next(arglist__25309));
      return G__25305__delegate.call(this, coll, x, xs)
    };
    return G__25305
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__25302.call(this, coll, x);
      default:
        return conj__25303.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__25303.cljs$lang$applyTo;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.count = function count(coll) {
  return cljs.core._count.call(null, coll)
};
cljs.core.nth = function() {
  var nth = null;
  var nth__25310 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__25311 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__25310.call(this, coll, n);
      case 3:
        return nth__25311.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__25313 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__25314 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__25313.call(this, o, k);
      case 3:
        return get__25314.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__25317 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__25318 = function() {
    var G__25320__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__25316 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__25321 = ret__25316;
          var G__25322 = cljs.core.first.call(null, kvs);
          var G__25323 = cljs.core.second.call(null, kvs);
          var G__25324 = cljs.core.nnext.call(null, kvs);
          coll = G__25321;
          k = G__25322;
          v = G__25323;
          kvs = G__25324;
          continue
        }else {
          return ret__25316
        }
        break
      }
    };
    var G__25320 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__25320__delegate.call(this, coll, k, v, kvs)
    };
    G__25320.cljs$lang$maxFixedArity = 3;
    G__25320.cljs$lang$applyTo = function(arglist__25325) {
      var coll = cljs.core.first(arglist__25325);
      var k = cljs.core.first(cljs.core.next(arglist__25325));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25325)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25325)));
      return G__25320__delegate.call(this, coll, k, v, kvs)
    };
    return G__25320
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__25317.call(this, coll, k, v);
      default:
        return assoc__25318.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__25318.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__25327 = function(coll) {
    return coll
  };
  var dissoc__25328 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__25329 = function() {
    var G__25331__delegate = function(coll, k, ks) {
      while(true) {
        var ret__25326 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__25332 = ret__25326;
          var G__25333 = cljs.core.first.call(null, ks);
          var G__25334 = cljs.core.next.call(null, ks);
          coll = G__25332;
          k = G__25333;
          ks = G__25334;
          continue
        }else {
          return ret__25326
        }
        break
      }
    };
    var G__25331 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25331__delegate.call(this, coll, k, ks)
    };
    G__25331.cljs$lang$maxFixedArity = 2;
    G__25331.cljs$lang$applyTo = function(arglist__25335) {
      var coll = cljs.core.first(arglist__25335);
      var k = cljs.core.first(cljs.core.next(arglist__25335));
      var ks = cljs.core.rest(cljs.core.next(arglist__25335));
      return G__25331__delegate.call(this, coll, k, ks)
    };
    return G__25331
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__25327.call(this, coll);
      case 2:
        return dissoc__25328.call(this, coll, k);
      default:
        return dissoc__25329.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__25329.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__451__auto____25336 = o;
    if(cljs.core.truth_(function() {
      var and__3546__auto____25337 = x__451__auto____25336;
      if(cljs.core.truth_(and__3546__auto____25337)) {
        var and__3546__auto____25338 = x__451__auto____25336.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3546__auto____25338)) {
          return cljs.core.not.call(null, x__451__auto____25336.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3546__auto____25338
        }
      }else {
        return and__3546__auto____25337
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____25336)
    }
  }())) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__25340 = function(coll) {
    return coll
  };
  var disj__25341 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__25342 = function() {
    var G__25344__delegate = function(coll, k, ks) {
      while(true) {
        var ret__25339 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__25345 = ret__25339;
          var G__25346 = cljs.core.first.call(null, ks);
          var G__25347 = cljs.core.next.call(null, ks);
          coll = G__25345;
          k = G__25346;
          ks = G__25347;
          continue
        }else {
          return ret__25339
        }
        break
      }
    };
    var G__25344 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25344__delegate.call(this, coll, k, ks)
    };
    G__25344.cljs$lang$maxFixedArity = 2;
    G__25344.cljs$lang$applyTo = function(arglist__25348) {
      var coll = cljs.core.first(arglist__25348);
      var k = cljs.core.first(cljs.core.next(arglist__25348));
      var ks = cljs.core.rest(cljs.core.next(arglist__25348));
      return G__25344__delegate.call(this, coll, k, ks)
    };
    return G__25344
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__25340.call(this, coll);
      case 2:
        return disj__25341.call(this, coll, k);
      default:
        return disj__25342.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__25342.cljs$lang$applyTo;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____25349 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____25350 = x__451__auto____25349;
      if(cljs.core.truth_(and__3546__auto____25350)) {
        var and__3546__auto____25351 = x__451__auto____25349.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3546__auto____25351)) {
          return cljs.core.not.call(null, x__451__auto____25349.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3546__auto____25351
        }
      }else {
        return and__3546__auto____25350
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__451__auto____25349)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____25352 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____25353 = x__451__auto____25352;
      if(cljs.core.truth_(and__3546__auto____25353)) {
        var and__3546__auto____25354 = x__451__auto____25352.cljs$core$ISet$;
        if(cljs.core.truth_(and__3546__auto____25354)) {
          return cljs.core.not.call(null, x__451__auto____25352.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3546__auto____25354
        }
      }else {
        return and__3546__auto____25353
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__451__auto____25352)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__451__auto____25355 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____25356 = x__451__auto____25355;
    if(cljs.core.truth_(and__3546__auto____25356)) {
      var and__3546__auto____25357 = x__451__auto____25355.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3546__auto____25357)) {
        return cljs.core.not.call(null, x__451__auto____25355.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3546__auto____25357
      }
    }else {
      return and__3546__auto____25356
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__451__auto____25355)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__451__auto____25358 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____25359 = x__451__auto____25358;
    if(cljs.core.truth_(and__3546__auto____25359)) {
      var and__3546__auto____25360 = x__451__auto____25358.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3546__auto____25360)) {
        return cljs.core.not.call(null, x__451__auto____25358.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3546__auto____25360
      }
    }else {
      return and__3546__auto____25359
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__451__auto____25358)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__451__auto____25361 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____25362 = x__451__auto____25361;
    if(cljs.core.truth_(and__3546__auto____25362)) {
      var and__3546__auto____25363 = x__451__auto____25361.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3546__auto____25363)) {
        return cljs.core.not.call(null, x__451__auto____25361.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3546__auto____25363
      }
    }else {
      return and__3546__auto____25362
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__451__auto____25361)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__451__auto____25364 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____25365 = x__451__auto____25364;
      if(cljs.core.truth_(and__3546__auto____25365)) {
        var and__3546__auto____25366 = x__451__auto____25364.cljs$core$IMap$;
        if(cljs.core.truth_(and__3546__auto____25366)) {
          return cljs.core.not.call(null, x__451__auto____25364.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3546__auto____25366
        }
      }else {
        return and__3546__auto____25365
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__451__auto____25364)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__451__auto____25367 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____25368 = x__451__auto____25367;
    if(cljs.core.truth_(and__3546__auto____25368)) {
      var and__3546__auto____25369 = x__451__auto____25367.cljs$core$IVector$;
      if(cljs.core.truth_(and__3546__auto____25369)) {
        return cljs.core.not.call(null, x__451__auto____25367.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3546__auto____25369
      }
    }else {
      return and__3546__auto____25368
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__451__auto____25367)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__25370 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__25370.push(key)
  });
  return keys__25370
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.lookup_sentinel = cljs.core.js_obj.call(null);
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(cljs.core.truth_(s === null)) {
    return false
  }else {
    var x__451__auto____25371 = s;
    if(cljs.core.truth_(function() {
      var and__3546__auto____25372 = x__451__auto____25371;
      if(cljs.core.truth_(and__3546__auto____25372)) {
        var and__3546__auto____25373 = x__451__auto____25371.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3546__auto____25373)) {
          return cljs.core.not.call(null, x__451__auto____25371.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3546__auto____25373
        }
      }else {
        return and__3546__auto____25372
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__451__auto____25371)
    }
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3546__auto____25374 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____25374)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____25375 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3548__auto____25375)) {
        return or__3548__auto____25375
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3546__auto____25374
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____25376 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____25376)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3546__auto____25376
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____25377 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____25377)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3546__auto____25377
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____25378 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3546__auto____25378)) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____25378
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.truth_(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____25379 = coll;
    if(cljs.core.truth_(and__3546__auto____25379)) {
      var and__3546__auto____25380 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3546__auto____25380)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____25380
      }
    }else {
      return and__3546__auto____25379
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___25385 = function(x) {
    return true
  };
  var distinct_QMARK___25386 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___25387 = function() {
    var G__25389__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__25381 = cljs.core.set([y, x]);
        var xs__25382 = more;
        while(true) {
          var x__25383 = cljs.core.first.call(null, xs__25382);
          var etc__25384 = cljs.core.next.call(null, xs__25382);
          if(cljs.core.truth_(xs__25382)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__25381, x__25383))) {
              return false
            }else {
              var G__25390 = cljs.core.conj.call(null, s__25381, x__25383);
              var G__25391 = etc__25384;
              s__25381 = G__25390;
              xs__25382 = G__25391;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__25389 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25389__delegate.call(this, x, y, more)
    };
    G__25389.cljs$lang$maxFixedArity = 2;
    G__25389.cljs$lang$applyTo = function(arglist__25392) {
      var x = cljs.core.first(arglist__25392);
      var y = cljs.core.first(cljs.core.next(arglist__25392));
      var more = cljs.core.rest(cljs.core.next(arglist__25392));
      return G__25389__delegate.call(this, x, y, more)
    };
    return G__25389
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___25385.call(this, x);
      case 2:
        return distinct_QMARK___25386.call(this, x, y);
      default:
        return distinct_QMARK___25387.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___25387.cljs$lang$applyTo;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  return goog.array.defaultCompare.call(null, x, y)
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, f, cljs.core.compare))) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__25393 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__25393))) {
        return r__25393
      }else {
        if(cljs.core.truth_(r__25393)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__25395 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__25396 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__25394 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__25394, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__25394)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__25395.call(this, comp);
      case 2:
        return sort__25396.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__25398 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__25399 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__25398.call(this, keyfn, comp);
      case 3:
        return sort_by__25399.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__25401 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__25402 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__25401.call(this, f, val);
      case 3:
        return reduce__25402.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__25408 = function(f, coll) {
    var temp__3695__auto____25404 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____25404)) {
      var s__25405 = temp__3695__auto____25404;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__25405), cljs.core.next.call(null, s__25405))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__25409 = function(f, val, coll) {
    var val__25406 = val;
    var coll__25407 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__25407)) {
        var G__25411 = f.call(null, val__25406, cljs.core.first.call(null, coll__25407));
        var G__25412 = cljs.core.next.call(null, coll__25407);
        val__25406 = G__25411;
        coll__25407 = G__25412;
        continue
      }else {
        return val__25406
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__25408.call(this, f, val);
      case 3:
        return seq_reduce__25409.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__25413 = null;
  var G__25413__25414 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__25413__25415 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__25413 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__25413__25414.call(this, coll, f);
      case 3:
        return G__25413__25415.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25413
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___25417 = function() {
    return 0
  };
  var _PLUS___25418 = function(x) {
    return x
  };
  var _PLUS___25419 = function(x, y) {
    return x + y
  };
  var _PLUS___25420 = function() {
    var G__25422__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__25422 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25422__delegate.call(this, x, y, more)
    };
    G__25422.cljs$lang$maxFixedArity = 2;
    G__25422.cljs$lang$applyTo = function(arglist__25423) {
      var x = cljs.core.first(arglist__25423);
      var y = cljs.core.first(cljs.core.next(arglist__25423));
      var more = cljs.core.rest(cljs.core.next(arglist__25423));
      return G__25422__delegate.call(this, x, y, more)
    };
    return G__25422
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___25417.call(this);
      case 1:
        return _PLUS___25418.call(this, x);
      case 2:
        return _PLUS___25419.call(this, x, y);
      default:
        return _PLUS___25420.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___25420.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___25424 = function(x) {
    return-x
  };
  var ___25425 = function(x, y) {
    return x - y
  };
  var ___25426 = function() {
    var G__25428__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__25428 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25428__delegate.call(this, x, y, more)
    };
    G__25428.cljs$lang$maxFixedArity = 2;
    G__25428.cljs$lang$applyTo = function(arglist__25429) {
      var x = cljs.core.first(arglist__25429);
      var y = cljs.core.first(cljs.core.next(arglist__25429));
      var more = cljs.core.rest(cljs.core.next(arglist__25429));
      return G__25428__delegate.call(this, x, y, more)
    };
    return G__25428
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___25424.call(this, x);
      case 2:
        return ___25425.call(this, x, y);
      default:
        return ___25426.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___25426.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___25430 = function() {
    return 1
  };
  var _STAR___25431 = function(x) {
    return x
  };
  var _STAR___25432 = function(x, y) {
    return x * y
  };
  var _STAR___25433 = function() {
    var G__25435__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__25435 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25435__delegate.call(this, x, y, more)
    };
    G__25435.cljs$lang$maxFixedArity = 2;
    G__25435.cljs$lang$applyTo = function(arglist__25436) {
      var x = cljs.core.first(arglist__25436);
      var y = cljs.core.first(cljs.core.next(arglist__25436));
      var more = cljs.core.rest(cljs.core.next(arglist__25436));
      return G__25435__delegate.call(this, x, y, more)
    };
    return G__25435
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___25430.call(this);
      case 1:
        return _STAR___25431.call(this, x);
      case 2:
        return _STAR___25432.call(this, x, y);
      default:
        return _STAR___25433.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___25433.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___25437 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___25438 = function(x, y) {
    return x / y
  };
  var _SLASH___25439 = function() {
    var G__25441__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__25441 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25441__delegate.call(this, x, y, more)
    };
    G__25441.cljs$lang$maxFixedArity = 2;
    G__25441.cljs$lang$applyTo = function(arglist__25442) {
      var x = cljs.core.first(arglist__25442);
      var y = cljs.core.first(cljs.core.next(arglist__25442));
      var more = cljs.core.rest(cljs.core.next(arglist__25442));
      return G__25441__delegate.call(this, x, y, more)
    };
    return G__25441
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___25437.call(this, x);
      case 2:
        return _SLASH___25438.call(this, x, y);
      default:
        return _SLASH___25439.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___25439.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___25443 = function(x) {
    return true
  };
  var _LT___25444 = function(x, y) {
    return x < y
  };
  var _LT___25445 = function() {
    var G__25447__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__25448 = y;
            var G__25449 = cljs.core.first.call(null, more);
            var G__25450 = cljs.core.next.call(null, more);
            x = G__25448;
            y = G__25449;
            more = G__25450;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__25447 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25447__delegate.call(this, x, y, more)
    };
    G__25447.cljs$lang$maxFixedArity = 2;
    G__25447.cljs$lang$applyTo = function(arglist__25451) {
      var x = cljs.core.first(arglist__25451);
      var y = cljs.core.first(cljs.core.next(arglist__25451));
      var more = cljs.core.rest(cljs.core.next(arglist__25451));
      return G__25447__delegate.call(this, x, y, more)
    };
    return G__25447
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___25443.call(this, x);
      case 2:
        return _LT___25444.call(this, x, y);
      default:
        return _LT___25445.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___25445.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___25452 = function(x) {
    return true
  };
  var _LT__EQ___25453 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___25454 = function() {
    var G__25456__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__25457 = y;
            var G__25458 = cljs.core.first.call(null, more);
            var G__25459 = cljs.core.next.call(null, more);
            x = G__25457;
            y = G__25458;
            more = G__25459;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__25456 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25456__delegate.call(this, x, y, more)
    };
    G__25456.cljs$lang$maxFixedArity = 2;
    G__25456.cljs$lang$applyTo = function(arglist__25460) {
      var x = cljs.core.first(arglist__25460);
      var y = cljs.core.first(cljs.core.next(arglist__25460));
      var more = cljs.core.rest(cljs.core.next(arglist__25460));
      return G__25456__delegate.call(this, x, y, more)
    };
    return G__25456
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___25452.call(this, x);
      case 2:
        return _LT__EQ___25453.call(this, x, y);
      default:
        return _LT__EQ___25454.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___25454.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___25461 = function(x) {
    return true
  };
  var _GT___25462 = function(x, y) {
    return x > y
  };
  var _GT___25463 = function() {
    var G__25465__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__25466 = y;
            var G__25467 = cljs.core.first.call(null, more);
            var G__25468 = cljs.core.next.call(null, more);
            x = G__25466;
            y = G__25467;
            more = G__25468;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__25465 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25465__delegate.call(this, x, y, more)
    };
    G__25465.cljs$lang$maxFixedArity = 2;
    G__25465.cljs$lang$applyTo = function(arglist__25469) {
      var x = cljs.core.first(arglist__25469);
      var y = cljs.core.first(cljs.core.next(arglist__25469));
      var more = cljs.core.rest(cljs.core.next(arglist__25469));
      return G__25465__delegate.call(this, x, y, more)
    };
    return G__25465
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___25461.call(this, x);
      case 2:
        return _GT___25462.call(this, x, y);
      default:
        return _GT___25463.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___25463.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___25470 = function(x) {
    return true
  };
  var _GT__EQ___25471 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___25472 = function() {
    var G__25474__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__25475 = y;
            var G__25476 = cljs.core.first.call(null, more);
            var G__25477 = cljs.core.next.call(null, more);
            x = G__25475;
            y = G__25476;
            more = G__25477;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__25474 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25474__delegate.call(this, x, y, more)
    };
    G__25474.cljs$lang$maxFixedArity = 2;
    G__25474.cljs$lang$applyTo = function(arglist__25478) {
      var x = cljs.core.first(arglist__25478);
      var y = cljs.core.first(cljs.core.next(arglist__25478));
      var more = cljs.core.rest(cljs.core.next(arglist__25478));
      return G__25474__delegate.call(this, x, y, more)
    };
    return G__25474
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___25470.call(this, x);
      case 2:
        return _GT__EQ___25471.call(this, x, y);
      default:
        return _GT__EQ___25472.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___25472.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__25479 = function(x) {
    return x
  };
  var max__25480 = function(x, y) {
    return x > y ? x : y
  };
  var max__25481 = function() {
    var G__25483__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__25483 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25483__delegate.call(this, x, y, more)
    };
    G__25483.cljs$lang$maxFixedArity = 2;
    G__25483.cljs$lang$applyTo = function(arglist__25484) {
      var x = cljs.core.first(arglist__25484);
      var y = cljs.core.first(cljs.core.next(arglist__25484));
      var more = cljs.core.rest(cljs.core.next(arglist__25484));
      return G__25483__delegate.call(this, x, y, more)
    };
    return G__25483
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__25479.call(this, x);
      case 2:
        return max__25480.call(this, x, y);
      default:
        return max__25481.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__25481.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__25485 = function(x) {
    return x
  };
  var min__25486 = function(x, y) {
    return x < y ? x : y
  };
  var min__25487 = function() {
    var G__25489__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__25489 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25489__delegate.call(this, x, y, more)
    };
    G__25489.cljs$lang$maxFixedArity = 2;
    G__25489.cljs$lang$applyTo = function(arglist__25490) {
      var x = cljs.core.first(arglist__25490);
      var y = cljs.core.first(cljs.core.next(arglist__25490));
      var more = cljs.core.rest(cljs.core.next(arglist__25490));
      return G__25489__delegate.call(this, x, y, more)
    };
    return G__25489
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__25485.call(this, x);
      case 2:
        return min__25486.call(this, x, y);
      default:
        return min__25487.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__25487.cljs$lang$applyTo;
  return min
}();
cljs.core.fix = function fix(q) {
  if(cljs.core.truth_(q >= 0)) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__25491 = n % d;
  return cljs.core.fix.call(null, (n - rem__25491) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__25492 = cljs.core.quot.call(null, n, d);
  return n - d * q__25492
};
cljs.core.rand = function() {
  var rand = null;
  var rand__25493 = function() {
    return Math.random.call(null)
  };
  var rand__25494 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__25493.call(this);
      case 1:
        return rand__25494.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___25496 = function(x) {
    return true
  };
  var _EQ__EQ___25497 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___25498 = function() {
    var G__25500__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__25501 = y;
            var G__25502 = cljs.core.first.call(null, more);
            var G__25503 = cljs.core.next.call(null, more);
            x = G__25501;
            y = G__25502;
            more = G__25503;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__25500 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25500__delegate.call(this, x, y, more)
    };
    G__25500.cljs$lang$maxFixedArity = 2;
    G__25500.cljs$lang$applyTo = function(arglist__25504) {
      var x = cljs.core.first(arglist__25504);
      var y = cljs.core.first(cljs.core.next(arglist__25504));
      var more = cljs.core.rest(cljs.core.next(arglist__25504));
      return G__25500__delegate.call(this, x, y, more)
    };
    return G__25500
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___25496.call(this, x);
      case 2:
        return _EQ__EQ___25497.call(this, x, y);
      default:
        return _EQ__EQ___25498.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___25498.cljs$lang$applyTo;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__25505 = n;
  var xs__25506 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25507 = xs__25506;
      if(cljs.core.truth_(and__3546__auto____25507)) {
        return n__25505 > 0
      }else {
        return and__3546__auto____25507
      }
    }())) {
      var G__25508 = n__25505 - 1;
      var G__25509 = cljs.core.next.call(null, xs__25506);
      n__25505 = G__25508;
      xs__25506 = G__25509;
      continue
    }else {
      return xs__25506
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__25514 = null;
  var G__25514__25515 = function(coll, n) {
    var temp__3695__auto____25510 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____25510)) {
      var xs__25511 = temp__3695__auto____25510;
      return cljs.core.first.call(null, xs__25511)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__25514__25516 = function(coll, n, not_found) {
    var temp__3695__auto____25512 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____25512)) {
      var xs__25513 = temp__3695__auto____25512;
      return cljs.core.first.call(null, xs__25513)
    }else {
      return not_found
    }
  };
  G__25514 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__25514__25515.call(this, coll, n);
      case 3:
        return G__25514__25516.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25514
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___25518 = function() {
    return""
  };
  var str_STAR___25519 = function(x) {
    if(cljs.core.truth_(x === null)) {
      return""
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___25520 = function() {
    var G__25522__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__25523 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__25524 = cljs.core.next.call(null, more);
            sb = G__25523;
            more = G__25524;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__25522 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__25522__delegate.call(this, x, ys)
    };
    G__25522.cljs$lang$maxFixedArity = 1;
    G__25522.cljs$lang$applyTo = function(arglist__25525) {
      var x = cljs.core.first(arglist__25525);
      var ys = cljs.core.rest(arglist__25525);
      return G__25522__delegate.call(this, x, ys)
    };
    return G__25522
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___25518.call(this);
      case 1:
        return str_STAR___25519.call(this, x);
      default:
        return str_STAR___25520.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___25520.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__25526 = function() {
    return""
  };
  var str__25527 = function(x) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, x))) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, x))) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(cljs.core.truth_(x === null)) {
          return""
        }else {
          if(cljs.core.truth_("\ufdd0'else")) {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__25528 = function() {
    var G__25530__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__25531 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__25532 = cljs.core.next.call(null, more);
            sb = G__25531;
            more = G__25532;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__25530 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__25530__delegate.call(this, x, ys)
    };
    G__25530.cljs$lang$maxFixedArity = 1;
    G__25530.cljs$lang$applyTo = function(arglist__25533) {
      var x = cljs.core.first(arglist__25533);
      var ys = cljs.core.rest(arglist__25533);
      return G__25530__delegate.call(this, x, ys)
    };
    return G__25530
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__25526.call(this);
      case 1:
        return str__25527.call(this, x);
      default:
        return str__25528.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__25528.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__25534 = function(s, start) {
    return s.substring(start)
  };
  var subs__25535 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__25534.call(this, s, start);
      case 3:
        return subs__25535.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__25537 = function(name) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
      name
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__25538 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__25537.call(this, ns);
      case 2:
        return symbol__25538.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__25540 = function(name) {
    if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
      return name
    }else {
      if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__25541 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__25540.call(this, ns);
      case 2:
        return keyword__25541.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__25543 = cljs.core.seq.call(null, x);
    var ys__25544 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(xs__25543 === null)) {
        return ys__25544 === null
      }else {
        if(cljs.core.truth_(ys__25544 === null)) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__25543), cljs.core.first.call(null, ys__25544)))) {
            var G__25545 = cljs.core.next.call(null, xs__25543);
            var G__25546 = cljs.core.next.call(null, ys__25544);
            xs__25543 = G__25545;
            ys__25544 = G__25546;
            continue
          }else {
            if(cljs.core.truth_("\ufdd0'else")) {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__25547_SHARP_, p2__25548_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__25547_SHARP_, cljs.core.hash.call(null, p2__25548_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__25549__25550 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__25549__25550)) {
    var G__25552__25554 = cljs.core.first.call(null, G__25549__25550);
    var vec__25553__25555 = G__25552__25554;
    var key_name__25556 = cljs.core.nth.call(null, vec__25553__25555, 0, null);
    var f__25557 = cljs.core.nth.call(null, vec__25553__25555, 1, null);
    var G__25549__25558 = G__25549__25550;
    var G__25552__25559 = G__25552__25554;
    var G__25549__25560 = G__25549__25558;
    while(true) {
      var vec__25561__25562 = G__25552__25559;
      var key_name__25563 = cljs.core.nth.call(null, vec__25561__25562, 0, null);
      var f__25564 = cljs.core.nth.call(null, vec__25561__25562, 1, null);
      var G__25549__25565 = G__25549__25560;
      var str_name__25566 = cljs.core.name.call(null, key_name__25563);
      obj[str_name__25566] = f__25564;
      var temp__3698__auto____25567 = cljs.core.next.call(null, G__25549__25565);
      if(cljs.core.truth_(temp__3698__auto____25567)) {
        var G__25549__25568 = temp__3698__auto____25567;
        var G__25569 = cljs.core.first.call(null, G__25549__25568);
        var G__25570 = G__25549__25568;
        G__25552__25559 = G__25569;
        G__25549__25560 = G__25570;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count
};
cljs.core.List.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__25571 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__25572 = this;
  return new cljs.core.List(this__25572.meta, o, coll, this__25572.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__25573 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__25574 = this;
  return this__25574.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__25575 = this;
  return this__25575.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__25576 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__25577 = this;
  return this__25577.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__25578 = this;
  return this__25578.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__25579 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__25580 = this;
  return new cljs.core.List(meta, this__25580.first, this__25580.rest, this__25580.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__25581 = this;
  return this__25581.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__25582 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta
};
cljs.core.EmptyList.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__25583 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__25584 = this;
  return new cljs.core.List(this__25584.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__25585 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__25586 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__25587 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__25588 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__25589 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__25590 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__25591 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__25592 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__25593 = this;
  return this__25593.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__25594 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__25595) {
    var items = cljs.core.seq(arglist__25595);
    return list__delegate.call(this, items)
  };
  return list
}();
cljs.core.Cons = function(meta, first, rest) {
  this.meta = meta;
  this.first = first;
  this.rest = rest
};
cljs.core.Cons.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__25596 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__25597 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__25598 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__25599 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__25599.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__25600 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__25601 = this;
  return this__25601.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__25602 = this;
  if(cljs.core.truth_(this__25602.rest === null)) {
    return cljs.core.List.EMPTY
  }else {
    return this__25602.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__25603 = this;
  return this__25603.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__25604 = this;
  return new cljs.core.Cons(meta, this__25604.first, this__25604.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__25605 = null;
  var G__25605__25606 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__25605__25607 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__25605 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__25605__25606.call(this, string, f);
      case 3:
        return G__25605__25607.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25605
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__25609 = null;
  var G__25609__25610 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__25609__25611 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__25609 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__25609__25610.call(this, string, k);
      case 3:
        return G__25609__25611.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25609
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__25613 = null;
  var G__25613__25614 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__25613__25615 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__25613 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__25613__25614.call(this, string, n);
      case 3:
        return G__25613__25615.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25613
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__25623 = null;
  var G__25623__25624 = function(tsym25617, coll) {
    var tsym25617__25619 = this;
    var this$__25620 = tsym25617__25619;
    return cljs.core.get.call(null, coll, this$__25620.toString())
  };
  var G__25623__25625 = function(tsym25618, coll, not_found) {
    var tsym25618__25621 = this;
    var this$__25622 = tsym25618__25621;
    return cljs.core.get.call(null, coll, this$__25622.toString(), not_found)
  };
  G__25623 = function(tsym25618, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__25623__25624.call(this, tsym25618, coll);
      case 3:
        return G__25623__25625.call(this, tsym25618, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__25623
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__25627 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__25627
  }else {
    lazy_seq.x = x__25627.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x) {
  this.meta = meta;
  this.realized = realized;
  this.x = x
};
cljs.core.LazySeq.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__25628 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__25629 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__25630 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__25631 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__25631.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__25632 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__25633 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__25634 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__25635 = this;
  return this__25635.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__25636 = this;
  return new cljs.core.LazySeq(meta, this__25636.realized, this__25636.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__25637 = [];
  var s__25638 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__25638))) {
      ary__25637.push(cljs.core.first.call(null, s__25638));
      var G__25639 = cljs.core.next.call(null, s__25638);
      s__25638 = G__25639;
      continue
    }else {
      return ary__25637
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__25640 = s;
  var i__25641 = n;
  var sum__25642 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____25643 = i__25641 > 0;
      if(cljs.core.truth_(and__3546__auto____25643)) {
        return cljs.core.seq.call(null, s__25640)
      }else {
        return and__3546__auto____25643
      }
    }())) {
      var G__25644 = cljs.core.next.call(null, s__25640);
      var G__25645 = i__25641 - 1;
      var G__25646 = sum__25642 + 1;
      s__25640 = G__25644;
      i__25641 = G__25645;
      sum__25642 = G__25646;
      continue
    }else {
      return sum__25642
    }
    break
  }
};
cljs.core.spread = function spread(arglist) {
  if(cljs.core.truth_(arglist === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core.next.call(null, arglist) === null)) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__25650 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__25651 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__25652 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__25647 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__25647)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__25647), concat.call(null, cljs.core.rest.call(null, s__25647), y))
      }else {
        return y
      }
    })
  };
  var concat__25653 = function() {
    var G__25655__delegate = function(x, y, zs) {
      var cat__25649 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__25648 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__25648)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__25648), cat.call(null, cljs.core.rest.call(null, xys__25648), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__25649.call(null, concat.call(null, x, y), zs)
    };
    var G__25655 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25655__delegate.call(this, x, y, zs)
    };
    G__25655.cljs$lang$maxFixedArity = 2;
    G__25655.cljs$lang$applyTo = function(arglist__25656) {
      var x = cljs.core.first(arglist__25656);
      var y = cljs.core.first(cljs.core.next(arglist__25656));
      var zs = cljs.core.rest(cljs.core.next(arglist__25656));
      return G__25655__delegate.call(this, x, y, zs)
    };
    return G__25655
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__25650.call(this);
      case 1:
        return concat__25651.call(this, x);
      case 2:
        return concat__25652.call(this, x, y);
      default:
        return concat__25653.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__25653.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___25657 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___25658 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___25659 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___25660 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___25661 = function() {
    var G__25663__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__25663 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__25663__delegate.call(this, a, b, c, d, more)
    };
    G__25663.cljs$lang$maxFixedArity = 4;
    G__25663.cljs$lang$applyTo = function(arglist__25664) {
      var a = cljs.core.first(arglist__25664);
      var b = cljs.core.first(cljs.core.next(arglist__25664));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25664)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25664))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25664))));
      return G__25663__delegate.call(this, a, b, c, d, more)
    };
    return G__25663
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___25657.call(this, a);
      case 2:
        return list_STAR___25658.call(this, a, b);
      case 3:
        return list_STAR___25659.call(this, a, b, c);
      case 4:
        return list_STAR___25660.call(this, a, b, c, d);
      default:
        return list_STAR___25661.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___25661.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__25674 = function(f, args) {
    var fixed_arity__25665 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__25665 + 1) <= fixed_arity__25665)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__25675 = function(f, x, args) {
    var arglist__25666 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__25667 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__25666, fixed_arity__25667) <= fixed_arity__25667)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__25666))
      }else {
        return f.cljs$lang$applyTo(arglist__25666)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__25666))
    }
  };
  var apply__25676 = function(f, x, y, args) {
    var arglist__25668 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__25669 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__25668, fixed_arity__25669) <= fixed_arity__25669)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__25668))
      }else {
        return f.cljs$lang$applyTo(arglist__25668)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__25668))
    }
  };
  var apply__25677 = function(f, x, y, z, args) {
    var arglist__25670 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__25671 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__25670, fixed_arity__25671) <= fixed_arity__25671)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__25670))
      }else {
        return f.cljs$lang$applyTo(arglist__25670)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__25670))
    }
  };
  var apply__25678 = function() {
    var G__25680__delegate = function(f, a, b, c, d, args) {
      var arglist__25672 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__25673 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__25672, fixed_arity__25673) <= fixed_arity__25673)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__25672))
        }else {
          return f.cljs$lang$applyTo(arglist__25672)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__25672))
      }
    };
    var G__25680 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__25680__delegate.call(this, f, a, b, c, d, args)
    };
    G__25680.cljs$lang$maxFixedArity = 5;
    G__25680.cljs$lang$applyTo = function(arglist__25681) {
      var f = cljs.core.first(arglist__25681);
      var a = cljs.core.first(cljs.core.next(arglist__25681));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25681)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25681))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25681)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25681)))));
      return G__25680__delegate.call(this, f, a, b, c, d, args)
    };
    return G__25680
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__25674.call(this, f, a);
      case 3:
        return apply__25675.call(this, f, a, b);
      case 4:
        return apply__25676.call(this, f, a, b, c);
      case 5:
        return apply__25677.call(this, f, a, b, c, d);
      default:
        return apply__25678.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__25678.cljs$lang$applyTo;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__25682) {
    var obj = cljs.core.first(arglist__25682);
    var f = cljs.core.first(cljs.core.next(arglist__25682));
    var args = cljs.core.rest(cljs.core.next(arglist__25682));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___25683 = function(x) {
    return false
  };
  var not_EQ___25684 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___25685 = function() {
    var G__25687__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__25687 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__25687__delegate.call(this, x, y, more)
    };
    G__25687.cljs$lang$maxFixedArity = 2;
    G__25687.cljs$lang$applyTo = function(arglist__25688) {
      var x = cljs.core.first(arglist__25688);
      var y = cljs.core.first(cljs.core.next(arglist__25688));
      var more = cljs.core.rest(cljs.core.next(arglist__25688));
      return G__25687__delegate.call(this, x, y, more)
    };
    return G__25687
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___25683.call(this, x);
      case 2:
        return not_EQ___25684.call(this, x, y);
      default:
        return not_EQ___25685.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___25685.cljs$lang$applyTo;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll) === null)) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__25689 = pred;
        var G__25690 = cljs.core.next.call(null, coll);
        pred = G__25689;
        coll = G__25690;
        continue
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3548__auto____25691 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____25691)) {
        return or__3548__auto____25691
      }else {
        var G__25692 = pred;
        var G__25693 = cljs.core.next.call(null, coll);
        pred = G__25692;
        coll = G__25693;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.truth_(cljs.core.integer_QMARK_.call(null, n))) {
    return(n & 1) === 0
  }else {
    throw new Error(cljs.core.str.call(null, "Argument must be an integer: ", n));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__25694 = null;
    var G__25694__25695 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__25694__25696 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__25694__25697 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__25694__25698 = function() {
      var G__25700__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__25700 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__25700__delegate.call(this, x, y, zs)
      };
      G__25700.cljs$lang$maxFixedArity = 2;
      G__25700.cljs$lang$applyTo = function(arglist__25701) {
        var x = cljs.core.first(arglist__25701);
        var y = cljs.core.first(cljs.core.next(arglist__25701));
        var zs = cljs.core.rest(cljs.core.next(arglist__25701));
        return G__25700__delegate.call(this, x, y, zs)
      };
      return G__25700
    }();
    G__25694 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__25694__25695.call(this);
        case 1:
          return G__25694__25696.call(this, x);
        case 2:
          return G__25694__25697.call(this, x, y);
        default:
          return G__25694__25698.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__25694.cljs$lang$maxFixedArity = 2;
    G__25694.cljs$lang$applyTo = G__25694__25698.cljs$lang$applyTo;
    return G__25694
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__25702__delegate = function(args) {
      return x
    };
    var G__25702 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__25702__delegate.call(this, args)
    };
    G__25702.cljs$lang$maxFixedArity = 0;
    G__25702.cljs$lang$applyTo = function(arglist__25703) {
      var args = cljs.core.seq(arglist__25703);
      return G__25702__delegate.call(this, args)
    };
    return G__25702
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__25707 = function() {
    return cljs.core.identity
  };
  var comp__25708 = function(f) {
    return f
  };
  var comp__25709 = function(f, g) {
    return function() {
      var G__25713 = null;
      var G__25713__25714 = function() {
        return f.call(null, g.call(null))
      };
      var G__25713__25715 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__25713__25716 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__25713__25717 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__25713__25718 = function() {
        var G__25720__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__25720 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25720__delegate.call(this, x, y, z, args)
        };
        G__25720.cljs$lang$maxFixedArity = 3;
        G__25720.cljs$lang$applyTo = function(arglist__25721) {
          var x = cljs.core.first(arglist__25721);
          var y = cljs.core.first(cljs.core.next(arglist__25721));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25721)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25721)));
          return G__25720__delegate.call(this, x, y, z, args)
        };
        return G__25720
      }();
      G__25713 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__25713__25714.call(this);
          case 1:
            return G__25713__25715.call(this, x);
          case 2:
            return G__25713__25716.call(this, x, y);
          case 3:
            return G__25713__25717.call(this, x, y, z);
          default:
            return G__25713__25718.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__25713.cljs$lang$maxFixedArity = 3;
      G__25713.cljs$lang$applyTo = G__25713__25718.cljs$lang$applyTo;
      return G__25713
    }()
  };
  var comp__25710 = function(f, g, h) {
    return function() {
      var G__25722 = null;
      var G__25722__25723 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__25722__25724 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__25722__25725 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__25722__25726 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__25722__25727 = function() {
        var G__25729__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__25729 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25729__delegate.call(this, x, y, z, args)
        };
        G__25729.cljs$lang$maxFixedArity = 3;
        G__25729.cljs$lang$applyTo = function(arglist__25730) {
          var x = cljs.core.first(arglist__25730);
          var y = cljs.core.first(cljs.core.next(arglist__25730));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25730)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25730)));
          return G__25729__delegate.call(this, x, y, z, args)
        };
        return G__25729
      }();
      G__25722 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__25722__25723.call(this);
          case 1:
            return G__25722__25724.call(this, x);
          case 2:
            return G__25722__25725.call(this, x, y);
          case 3:
            return G__25722__25726.call(this, x, y, z);
          default:
            return G__25722__25727.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__25722.cljs$lang$maxFixedArity = 3;
      G__25722.cljs$lang$applyTo = G__25722__25727.cljs$lang$applyTo;
      return G__25722
    }()
  };
  var comp__25711 = function() {
    var G__25731__delegate = function(f1, f2, f3, fs) {
      var fs__25704 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__25732__delegate = function(args) {
          var ret__25705 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__25704), args);
          var fs__25706 = cljs.core.next.call(null, fs__25704);
          while(true) {
            if(cljs.core.truth_(fs__25706)) {
              var G__25733 = cljs.core.first.call(null, fs__25706).call(null, ret__25705);
              var G__25734 = cljs.core.next.call(null, fs__25706);
              ret__25705 = G__25733;
              fs__25706 = G__25734;
              continue
            }else {
              return ret__25705
            }
            break
          }
        };
        var G__25732 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__25732__delegate.call(this, args)
        };
        G__25732.cljs$lang$maxFixedArity = 0;
        G__25732.cljs$lang$applyTo = function(arglist__25735) {
          var args = cljs.core.seq(arglist__25735);
          return G__25732__delegate.call(this, args)
        };
        return G__25732
      }()
    };
    var G__25731 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__25731__delegate.call(this, f1, f2, f3, fs)
    };
    G__25731.cljs$lang$maxFixedArity = 3;
    G__25731.cljs$lang$applyTo = function(arglist__25736) {
      var f1 = cljs.core.first(arglist__25736);
      var f2 = cljs.core.first(cljs.core.next(arglist__25736));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25736)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25736)));
      return G__25731__delegate.call(this, f1, f2, f3, fs)
    };
    return G__25731
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__25707.call(this);
      case 1:
        return comp__25708.call(this, f1);
      case 2:
        return comp__25709.call(this, f1, f2);
      case 3:
        return comp__25710.call(this, f1, f2, f3);
      default:
        return comp__25711.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__25711.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__25737 = function(f, arg1) {
    return function() {
      var G__25742__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__25742 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__25742__delegate.call(this, args)
      };
      G__25742.cljs$lang$maxFixedArity = 0;
      G__25742.cljs$lang$applyTo = function(arglist__25743) {
        var args = cljs.core.seq(arglist__25743);
        return G__25742__delegate.call(this, args)
      };
      return G__25742
    }()
  };
  var partial__25738 = function(f, arg1, arg2) {
    return function() {
      var G__25744__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__25744 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__25744__delegate.call(this, args)
      };
      G__25744.cljs$lang$maxFixedArity = 0;
      G__25744.cljs$lang$applyTo = function(arglist__25745) {
        var args = cljs.core.seq(arglist__25745);
        return G__25744__delegate.call(this, args)
      };
      return G__25744
    }()
  };
  var partial__25739 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__25746__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__25746 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__25746__delegate.call(this, args)
      };
      G__25746.cljs$lang$maxFixedArity = 0;
      G__25746.cljs$lang$applyTo = function(arglist__25747) {
        var args = cljs.core.seq(arglist__25747);
        return G__25746__delegate.call(this, args)
      };
      return G__25746
    }()
  };
  var partial__25740 = function() {
    var G__25748__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__25749__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__25749 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__25749__delegate.call(this, args)
        };
        G__25749.cljs$lang$maxFixedArity = 0;
        G__25749.cljs$lang$applyTo = function(arglist__25750) {
          var args = cljs.core.seq(arglist__25750);
          return G__25749__delegate.call(this, args)
        };
        return G__25749
      }()
    };
    var G__25748 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__25748__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__25748.cljs$lang$maxFixedArity = 4;
    G__25748.cljs$lang$applyTo = function(arglist__25751) {
      var f = cljs.core.first(arglist__25751);
      var arg1 = cljs.core.first(cljs.core.next(arglist__25751));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25751)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25751))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25751))));
      return G__25748__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__25748
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__25737.call(this, f, arg1);
      case 3:
        return partial__25738.call(this, f, arg1, arg2);
      case 4:
        return partial__25739.call(this, f, arg1, arg2, arg3);
      default:
        return partial__25740.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__25740.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__25752 = function(f, x) {
    return function() {
      var G__25756 = null;
      var G__25756__25757 = function(a) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a)
      };
      var G__25756__25758 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b)
      };
      var G__25756__25759 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b, c)
      };
      var G__25756__25760 = function() {
        var G__25762__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, b, c, ds)
        };
        var G__25762 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25762__delegate.call(this, a, b, c, ds)
        };
        G__25762.cljs$lang$maxFixedArity = 3;
        G__25762.cljs$lang$applyTo = function(arglist__25763) {
          var a = cljs.core.first(arglist__25763);
          var b = cljs.core.first(cljs.core.next(arglist__25763));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25763)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25763)));
          return G__25762__delegate.call(this, a, b, c, ds)
        };
        return G__25762
      }();
      G__25756 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__25756__25757.call(this, a);
          case 2:
            return G__25756__25758.call(this, a, b);
          case 3:
            return G__25756__25759.call(this, a, b, c);
          default:
            return G__25756__25760.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__25756.cljs$lang$maxFixedArity = 3;
      G__25756.cljs$lang$applyTo = G__25756__25760.cljs$lang$applyTo;
      return G__25756
    }()
  };
  var fnil__25753 = function(f, x, y) {
    return function() {
      var G__25764 = null;
      var G__25764__25765 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__25764__25766 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c)
      };
      var G__25764__25767 = function() {
        var G__25769__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c, ds)
        };
        var G__25769 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25769__delegate.call(this, a, b, c, ds)
        };
        G__25769.cljs$lang$maxFixedArity = 3;
        G__25769.cljs$lang$applyTo = function(arglist__25770) {
          var a = cljs.core.first(arglist__25770);
          var b = cljs.core.first(cljs.core.next(arglist__25770));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25770)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25770)));
          return G__25769__delegate.call(this, a, b, c, ds)
        };
        return G__25769
      }();
      G__25764 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__25764__25765.call(this, a, b);
          case 3:
            return G__25764__25766.call(this, a, b, c);
          default:
            return G__25764__25767.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__25764.cljs$lang$maxFixedArity = 3;
      G__25764.cljs$lang$applyTo = G__25764__25767.cljs$lang$applyTo;
      return G__25764
    }()
  };
  var fnil__25754 = function(f, x, y, z) {
    return function() {
      var G__25771 = null;
      var G__25771__25772 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__25771__25773 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c)
      };
      var G__25771__25774 = function() {
        var G__25776__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c, ds)
        };
        var G__25776 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25776__delegate.call(this, a, b, c, ds)
        };
        G__25776.cljs$lang$maxFixedArity = 3;
        G__25776.cljs$lang$applyTo = function(arglist__25777) {
          var a = cljs.core.first(arglist__25777);
          var b = cljs.core.first(cljs.core.next(arglist__25777));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25777)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25777)));
          return G__25776__delegate.call(this, a, b, c, ds)
        };
        return G__25776
      }();
      G__25771 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__25771__25772.call(this, a, b);
          case 3:
            return G__25771__25773.call(this, a, b, c);
          default:
            return G__25771__25774.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__25771.cljs$lang$maxFixedArity = 3;
      G__25771.cljs$lang$applyTo = G__25771__25774.cljs$lang$applyTo;
      return G__25771
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__25752.call(this, f, x);
      case 3:
        return fnil__25753.call(this, f, x, y);
      case 4:
        return fnil__25754.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__25780 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____25778 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____25778)) {
        var s__25779 = temp__3698__auto____25778;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__25779)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__25779)))
      }else {
        return null
      }
    })
  };
  return mapi__25780.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____25781 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____25781)) {
      var s__25782 = temp__3698__auto____25781;
      var x__25783 = f.call(null, cljs.core.first.call(null, s__25782));
      if(cljs.core.truth_(x__25783 === null)) {
        return keep.call(null, f, cljs.core.rest.call(null, s__25782))
      }else {
        return cljs.core.cons.call(null, x__25783, keep.call(null, f, cljs.core.rest.call(null, s__25782)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__25793 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____25790 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____25790)) {
        var s__25791 = temp__3698__auto____25790;
        var x__25792 = f.call(null, idx, cljs.core.first.call(null, s__25791));
        if(cljs.core.truth_(x__25792 === null)) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__25791))
        }else {
          return cljs.core.cons.call(null, x__25792, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__25791)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__25793.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__25838 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__25843 = function() {
        return true
      };
      var ep1__25844 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__25845 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____25800 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____25800)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____25800
          }
        }())
      };
      var ep1__25846 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____25801 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____25801)) {
            var and__3546__auto____25802 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____25802)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____25802
            }
          }else {
            return and__3546__auto____25801
          }
        }())
      };
      var ep1__25847 = function() {
        var G__25849__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____25803 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____25803)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____25803
            }
          }())
        };
        var G__25849 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25849__delegate.call(this, x, y, z, args)
        };
        G__25849.cljs$lang$maxFixedArity = 3;
        G__25849.cljs$lang$applyTo = function(arglist__25850) {
          var x = cljs.core.first(arglist__25850);
          var y = cljs.core.first(cljs.core.next(arglist__25850));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25850)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25850)));
          return G__25849__delegate.call(this, x, y, z, args)
        };
        return G__25849
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__25843.call(this);
          case 1:
            return ep1__25844.call(this, x);
          case 2:
            return ep1__25845.call(this, x, y);
          case 3:
            return ep1__25846.call(this, x, y, z);
          default:
            return ep1__25847.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__25847.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__25839 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__25851 = function() {
        return true
      };
      var ep2__25852 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____25804 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____25804)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____25804
          }
        }())
      };
      var ep2__25853 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____25805 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____25805)) {
            var and__3546__auto____25806 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____25806)) {
              var and__3546__auto____25807 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____25807)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____25807
              }
            }else {
              return and__3546__auto____25806
            }
          }else {
            return and__3546__auto____25805
          }
        }())
      };
      var ep2__25854 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____25808 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____25808)) {
            var and__3546__auto____25809 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____25809)) {
              var and__3546__auto____25810 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____25810)) {
                var and__3546__auto____25811 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____25811)) {
                  var and__3546__auto____25812 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____25812)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____25812
                  }
                }else {
                  return and__3546__auto____25811
                }
              }else {
                return and__3546__auto____25810
              }
            }else {
              return and__3546__auto____25809
            }
          }else {
            return and__3546__auto____25808
          }
        }())
      };
      var ep2__25855 = function() {
        var G__25857__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____25813 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____25813)) {
              return cljs.core.every_QMARK_.call(null, function(p1__25784_SHARP_) {
                var and__3546__auto____25814 = p1.call(null, p1__25784_SHARP_);
                if(cljs.core.truth_(and__3546__auto____25814)) {
                  return p2.call(null, p1__25784_SHARP_)
                }else {
                  return and__3546__auto____25814
                }
              }, args)
            }else {
              return and__3546__auto____25813
            }
          }())
        };
        var G__25857 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25857__delegate.call(this, x, y, z, args)
        };
        G__25857.cljs$lang$maxFixedArity = 3;
        G__25857.cljs$lang$applyTo = function(arglist__25858) {
          var x = cljs.core.first(arglist__25858);
          var y = cljs.core.first(cljs.core.next(arglist__25858));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25858)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25858)));
          return G__25857__delegate.call(this, x, y, z, args)
        };
        return G__25857
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__25851.call(this);
          case 1:
            return ep2__25852.call(this, x);
          case 2:
            return ep2__25853.call(this, x, y);
          case 3:
            return ep2__25854.call(this, x, y, z);
          default:
            return ep2__25855.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__25855.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__25840 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__25859 = function() {
        return true
      };
      var ep3__25860 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____25815 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____25815)) {
            var and__3546__auto____25816 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____25816)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____25816
            }
          }else {
            return and__3546__auto____25815
          }
        }())
      };
      var ep3__25861 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____25817 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____25817)) {
            var and__3546__auto____25818 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____25818)) {
              var and__3546__auto____25819 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____25819)) {
                var and__3546__auto____25820 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____25820)) {
                  var and__3546__auto____25821 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____25821)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____25821
                  }
                }else {
                  return and__3546__auto____25820
                }
              }else {
                return and__3546__auto____25819
              }
            }else {
              return and__3546__auto____25818
            }
          }else {
            return and__3546__auto____25817
          }
        }())
      };
      var ep3__25862 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____25822 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____25822)) {
            var and__3546__auto____25823 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____25823)) {
              var and__3546__auto____25824 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____25824)) {
                var and__3546__auto____25825 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____25825)) {
                  var and__3546__auto____25826 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____25826)) {
                    var and__3546__auto____25827 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____25827)) {
                      var and__3546__auto____25828 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____25828)) {
                        var and__3546__auto____25829 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____25829)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____25829
                        }
                      }else {
                        return and__3546__auto____25828
                      }
                    }else {
                      return and__3546__auto____25827
                    }
                  }else {
                    return and__3546__auto____25826
                  }
                }else {
                  return and__3546__auto____25825
                }
              }else {
                return and__3546__auto____25824
              }
            }else {
              return and__3546__auto____25823
            }
          }else {
            return and__3546__auto____25822
          }
        }())
      };
      var ep3__25863 = function() {
        var G__25865__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____25830 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____25830)) {
              return cljs.core.every_QMARK_.call(null, function(p1__25785_SHARP_) {
                var and__3546__auto____25831 = p1.call(null, p1__25785_SHARP_);
                if(cljs.core.truth_(and__3546__auto____25831)) {
                  var and__3546__auto____25832 = p2.call(null, p1__25785_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____25832)) {
                    return p3.call(null, p1__25785_SHARP_)
                  }else {
                    return and__3546__auto____25832
                  }
                }else {
                  return and__3546__auto____25831
                }
              }, args)
            }else {
              return and__3546__auto____25830
            }
          }())
        };
        var G__25865 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25865__delegate.call(this, x, y, z, args)
        };
        G__25865.cljs$lang$maxFixedArity = 3;
        G__25865.cljs$lang$applyTo = function(arglist__25866) {
          var x = cljs.core.first(arglist__25866);
          var y = cljs.core.first(cljs.core.next(arglist__25866));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25866)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25866)));
          return G__25865__delegate.call(this, x, y, z, args)
        };
        return G__25865
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__25859.call(this);
          case 1:
            return ep3__25860.call(this, x);
          case 2:
            return ep3__25861.call(this, x, y);
          case 3:
            return ep3__25862.call(this, x, y, z);
          default:
            return ep3__25863.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__25863.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__25841 = function() {
    var G__25867__delegate = function(p1, p2, p3, ps) {
      var ps__25833 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__25868 = function() {
          return true
        };
        var epn__25869 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__25786_SHARP_) {
            return p1__25786_SHARP_.call(null, x)
          }, ps__25833)
        };
        var epn__25870 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__25787_SHARP_) {
            var and__3546__auto____25834 = p1__25787_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____25834)) {
              return p1__25787_SHARP_.call(null, y)
            }else {
              return and__3546__auto____25834
            }
          }, ps__25833)
        };
        var epn__25871 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__25788_SHARP_) {
            var and__3546__auto____25835 = p1__25788_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____25835)) {
              var and__3546__auto____25836 = p1__25788_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____25836)) {
                return p1__25788_SHARP_.call(null, z)
              }else {
                return and__3546__auto____25836
              }
            }else {
              return and__3546__auto____25835
            }
          }, ps__25833)
        };
        var epn__25872 = function() {
          var G__25874__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____25837 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____25837)) {
                return cljs.core.every_QMARK_.call(null, function(p1__25789_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__25789_SHARP_, args)
                }, ps__25833)
              }else {
                return and__3546__auto____25837
              }
            }())
          };
          var G__25874 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__25874__delegate.call(this, x, y, z, args)
          };
          G__25874.cljs$lang$maxFixedArity = 3;
          G__25874.cljs$lang$applyTo = function(arglist__25875) {
            var x = cljs.core.first(arglist__25875);
            var y = cljs.core.first(cljs.core.next(arglist__25875));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25875)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25875)));
            return G__25874__delegate.call(this, x, y, z, args)
          };
          return G__25874
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__25868.call(this);
            case 1:
              return epn__25869.call(this, x);
            case 2:
              return epn__25870.call(this, x, y);
            case 3:
              return epn__25871.call(this, x, y, z);
            default:
              return epn__25872.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__25872.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__25867 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__25867__delegate.call(this, p1, p2, p3, ps)
    };
    G__25867.cljs$lang$maxFixedArity = 3;
    G__25867.cljs$lang$applyTo = function(arglist__25876) {
      var p1 = cljs.core.first(arglist__25876);
      var p2 = cljs.core.first(cljs.core.next(arglist__25876));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25876)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25876)));
      return G__25867__delegate.call(this, p1, p2, p3, ps)
    };
    return G__25867
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__25838.call(this, p1);
      case 2:
        return every_pred__25839.call(this, p1, p2);
      case 3:
        return every_pred__25840.call(this, p1, p2, p3);
      default:
        return every_pred__25841.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__25841.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__25916 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__25921 = function() {
        return null
      };
      var sp1__25922 = function(x) {
        return p.call(null, x)
      };
      var sp1__25923 = function(x, y) {
        var or__3548__auto____25878 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____25878)) {
          return or__3548__auto____25878
        }else {
          return p.call(null, y)
        }
      };
      var sp1__25924 = function(x, y, z) {
        var or__3548__auto____25879 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____25879)) {
          return or__3548__auto____25879
        }else {
          var or__3548__auto____25880 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____25880)) {
            return or__3548__auto____25880
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__25925 = function() {
        var G__25927__delegate = function(x, y, z, args) {
          var or__3548__auto____25881 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____25881)) {
            return or__3548__auto____25881
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__25927 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25927__delegate.call(this, x, y, z, args)
        };
        G__25927.cljs$lang$maxFixedArity = 3;
        G__25927.cljs$lang$applyTo = function(arglist__25928) {
          var x = cljs.core.first(arglist__25928);
          var y = cljs.core.first(cljs.core.next(arglist__25928));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25928)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25928)));
          return G__25927__delegate.call(this, x, y, z, args)
        };
        return G__25927
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__25921.call(this);
          case 1:
            return sp1__25922.call(this, x);
          case 2:
            return sp1__25923.call(this, x, y);
          case 3:
            return sp1__25924.call(this, x, y, z);
          default:
            return sp1__25925.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__25925.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__25917 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__25929 = function() {
        return null
      };
      var sp2__25930 = function(x) {
        var or__3548__auto____25882 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____25882)) {
          return or__3548__auto____25882
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__25931 = function(x, y) {
        var or__3548__auto____25883 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____25883)) {
          return or__3548__auto____25883
        }else {
          var or__3548__auto____25884 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____25884)) {
            return or__3548__auto____25884
          }else {
            var or__3548__auto____25885 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____25885)) {
              return or__3548__auto____25885
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__25932 = function(x, y, z) {
        var or__3548__auto____25886 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____25886)) {
          return or__3548__auto____25886
        }else {
          var or__3548__auto____25887 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____25887)) {
            return or__3548__auto____25887
          }else {
            var or__3548__auto____25888 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____25888)) {
              return or__3548__auto____25888
            }else {
              var or__3548__auto____25889 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____25889)) {
                return or__3548__auto____25889
              }else {
                var or__3548__auto____25890 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____25890)) {
                  return or__3548__auto____25890
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__25933 = function() {
        var G__25935__delegate = function(x, y, z, args) {
          var or__3548__auto____25891 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____25891)) {
            return or__3548__auto____25891
          }else {
            return cljs.core.some.call(null, function(p1__25794_SHARP_) {
              var or__3548__auto____25892 = p1.call(null, p1__25794_SHARP_);
              if(cljs.core.truth_(or__3548__auto____25892)) {
                return or__3548__auto____25892
              }else {
                return p2.call(null, p1__25794_SHARP_)
              }
            }, args)
          }
        };
        var G__25935 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25935__delegate.call(this, x, y, z, args)
        };
        G__25935.cljs$lang$maxFixedArity = 3;
        G__25935.cljs$lang$applyTo = function(arglist__25936) {
          var x = cljs.core.first(arglist__25936);
          var y = cljs.core.first(cljs.core.next(arglist__25936));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25936)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25936)));
          return G__25935__delegate.call(this, x, y, z, args)
        };
        return G__25935
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__25929.call(this);
          case 1:
            return sp2__25930.call(this, x);
          case 2:
            return sp2__25931.call(this, x, y);
          case 3:
            return sp2__25932.call(this, x, y, z);
          default:
            return sp2__25933.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__25933.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__25918 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__25937 = function() {
        return null
      };
      var sp3__25938 = function(x) {
        var or__3548__auto____25893 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____25893)) {
          return or__3548__auto____25893
        }else {
          var or__3548__auto____25894 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____25894)) {
            return or__3548__auto____25894
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__25939 = function(x, y) {
        var or__3548__auto____25895 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____25895)) {
          return or__3548__auto____25895
        }else {
          var or__3548__auto____25896 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____25896)) {
            return or__3548__auto____25896
          }else {
            var or__3548__auto____25897 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____25897)) {
              return or__3548__auto____25897
            }else {
              var or__3548__auto____25898 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____25898)) {
                return or__3548__auto____25898
              }else {
                var or__3548__auto____25899 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____25899)) {
                  return or__3548__auto____25899
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__25940 = function(x, y, z) {
        var or__3548__auto____25900 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____25900)) {
          return or__3548__auto____25900
        }else {
          var or__3548__auto____25901 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____25901)) {
            return or__3548__auto____25901
          }else {
            var or__3548__auto____25902 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____25902)) {
              return or__3548__auto____25902
            }else {
              var or__3548__auto____25903 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____25903)) {
                return or__3548__auto____25903
              }else {
                var or__3548__auto____25904 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____25904)) {
                  return or__3548__auto____25904
                }else {
                  var or__3548__auto____25905 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____25905)) {
                    return or__3548__auto____25905
                  }else {
                    var or__3548__auto____25906 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____25906)) {
                      return or__3548__auto____25906
                    }else {
                      var or__3548__auto____25907 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____25907)) {
                        return or__3548__auto____25907
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__25941 = function() {
        var G__25943__delegate = function(x, y, z, args) {
          var or__3548__auto____25908 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____25908)) {
            return or__3548__auto____25908
          }else {
            return cljs.core.some.call(null, function(p1__25795_SHARP_) {
              var or__3548__auto____25909 = p1.call(null, p1__25795_SHARP_);
              if(cljs.core.truth_(or__3548__auto____25909)) {
                return or__3548__auto____25909
              }else {
                var or__3548__auto____25910 = p2.call(null, p1__25795_SHARP_);
                if(cljs.core.truth_(or__3548__auto____25910)) {
                  return or__3548__auto____25910
                }else {
                  return p3.call(null, p1__25795_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__25943 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__25943__delegate.call(this, x, y, z, args)
        };
        G__25943.cljs$lang$maxFixedArity = 3;
        G__25943.cljs$lang$applyTo = function(arglist__25944) {
          var x = cljs.core.first(arglist__25944);
          var y = cljs.core.first(cljs.core.next(arglist__25944));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25944)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25944)));
          return G__25943__delegate.call(this, x, y, z, args)
        };
        return G__25943
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__25937.call(this);
          case 1:
            return sp3__25938.call(this, x);
          case 2:
            return sp3__25939.call(this, x, y);
          case 3:
            return sp3__25940.call(this, x, y, z);
          default:
            return sp3__25941.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__25941.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__25919 = function() {
    var G__25945__delegate = function(p1, p2, p3, ps) {
      var ps__25911 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__25946 = function() {
          return null
        };
        var spn__25947 = function(x) {
          return cljs.core.some.call(null, function(p1__25796_SHARP_) {
            return p1__25796_SHARP_.call(null, x)
          }, ps__25911)
        };
        var spn__25948 = function(x, y) {
          return cljs.core.some.call(null, function(p1__25797_SHARP_) {
            var or__3548__auto____25912 = p1__25797_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____25912)) {
              return or__3548__auto____25912
            }else {
              return p1__25797_SHARP_.call(null, y)
            }
          }, ps__25911)
        };
        var spn__25949 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__25798_SHARP_) {
            var or__3548__auto____25913 = p1__25798_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____25913)) {
              return or__3548__auto____25913
            }else {
              var or__3548__auto____25914 = p1__25798_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____25914)) {
                return or__3548__auto____25914
              }else {
                return p1__25798_SHARP_.call(null, z)
              }
            }
          }, ps__25911)
        };
        var spn__25950 = function() {
          var G__25952__delegate = function(x, y, z, args) {
            var or__3548__auto____25915 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____25915)) {
              return or__3548__auto____25915
            }else {
              return cljs.core.some.call(null, function(p1__25799_SHARP_) {
                return cljs.core.some.call(null, p1__25799_SHARP_, args)
              }, ps__25911)
            }
          };
          var G__25952 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__25952__delegate.call(this, x, y, z, args)
          };
          G__25952.cljs$lang$maxFixedArity = 3;
          G__25952.cljs$lang$applyTo = function(arglist__25953) {
            var x = cljs.core.first(arglist__25953);
            var y = cljs.core.first(cljs.core.next(arglist__25953));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25953)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25953)));
            return G__25952__delegate.call(this, x, y, z, args)
          };
          return G__25952
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__25946.call(this);
            case 1:
              return spn__25947.call(this, x);
            case 2:
              return spn__25948.call(this, x, y);
            case 3:
              return spn__25949.call(this, x, y, z);
            default:
              return spn__25950.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__25950.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__25945 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__25945__delegate.call(this, p1, p2, p3, ps)
    };
    G__25945.cljs$lang$maxFixedArity = 3;
    G__25945.cljs$lang$applyTo = function(arglist__25954) {
      var p1 = cljs.core.first(arglist__25954);
      var p2 = cljs.core.first(cljs.core.next(arglist__25954));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25954)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__25954)));
      return G__25945__delegate.call(this, p1, p2, p3, ps)
    };
    return G__25945
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__25916.call(this, p1);
      case 2:
        return some_fn__25917.call(this, p1, p2);
      case 3:
        return some_fn__25918.call(this, p1, p2, p3);
      default:
        return some_fn__25919.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__25919.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__25967 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____25955 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____25955)) {
        var s__25956 = temp__3698__auto____25955;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__25956)), map.call(null, f, cljs.core.rest.call(null, s__25956)))
      }else {
        return null
      }
    })
  };
  var map__25968 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__25957 = cljs.core.seq.call(null, c1);
      var s2__25958 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____25959 = s1__25957;
        if(cljs.core.truth_(and__3546__auto____25959)) {
          return s2__25958
        }else {
          return and__3546__auto____25959
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__25957), cljs.core.first.call(null, s2__25958)), map.call(null, f, cljs.core.rest.call(null, s1__25957), cljs.core.rest.call(null, s2__25958)))
      }else {
        return null
      }
    })
  };
  var map__25969 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__25960 = cljs.core.seq.call(null, c1);
      var s2__25961 = cljs.core.seq.call(null, c2);
      var s3__25962 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____25963 = s1__25960;
        if(cljs.core.truth_(and__3546__auto____25963)) {
          var and__3546__auto____25964 = s2__25961;
          if(cljs.core.truth_(and__3546__auto____25964)) {
            return s3__25962
          }else {
            return and__3546__auto____25964
          }
        }else {
          return and__3546__auto____25963
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__25960), cljs.core.first.call(null, s2__25961), cljs.core.first.call(null, s3__25962)), map.call(null, f, cljs.core.rest.call(null, s1__25960), cljs.core.rest.call(null, s2__25961), cljs.core.rest.call(null, s3__25962)))
      }else {
        return null
      }
    })
  };
  var map__25970 = function() {
    var G__25972__delegate = function(f, c1, c2, c3, colls) {
      var step__25966 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__25965 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__25965))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__25965), step.call(null, map.call(null, cljs.core.rest, ss__25965)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__25877_SHARP_) {
        return cljs.core.apply.call(null, f, p1__25877_SHARP_)
      }, step__25966.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__25972 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__25972__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__25972.cljs$lang$maxFixedArity = 4;
    G__25972.cljs$lang$applyTo = function(arglist__25973) {
      var f = cljs.core.first(arglist__25973);
      var c1 = cljs.core.first(cljs.core.next(arglist__25973));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__25973)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25973))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__25973))));
      return G__25972__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__25972
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__25967.call(this, f, c1);
      case 3:
        return map__25968.call(this, f, c1, c2);
      case 4:
        return map__25969.call(this, f, c1, c2, c3);
      default:
        return map__25970.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__25970.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3698__auto____25974 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____25974)) {
        var s__25975 = temp__3698__auto____25974;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__25975), take.call(null, n - 1, cljs.core.rest.call(null, s__25975)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__25978 = function(n, coll) {
    while(true) {
      var s__25976 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____25977 = n > 0;
        if(cljs.core.truth_(and__3546__auto____25977)) {
          return s__25976
        }else {
          return and__3546__auto____25977
        }
      }())) {
        var G__25979 = n - 1;
        var G__25980 = cljs.core.rest.call(null, s__25976);
        n = G__25979;
        coll = G__25980;
        continue
      }else {
        return s__25976
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__25978.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__25981 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__25982 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__25981.call(this, n);
      case 2:
        return drop_last__25982.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__25984 = cljs.core.seq.call(null, coll);
  var lead__25985 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__25985)) {
      var G__25986 = cljs.core.next.call(null, s__25984);
      var G__25987 = cljs.core.next.call(null, lead__25985);
      s__25984 = G__25986;
      lead__25985 = G__25987;
      continue
    }else {
      return s__25984
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__25990 = function(pred, coll) {
    while(true) {
      var s__25988 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____25989 = s__25988;
        if(cljs.core.truth_(and__3546__auto____25989)) {
          return pred.call(null, cljs.core.first.call(null, s__25988))
        }else {
          return and__3546__auto____25989
        }
      }())) {
        var G__25991 = pred;
        var G__25992 = cljs.core.rest.call(null, s__25988);
        pred = G__25991;
        coll = G__25992;
        continue
      }else {
        return s__25988
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__25990.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____25993 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____25993)) {
      var s__25994 = temp__3698__auto____25993;
      return cljs.core.concat.call(null, s__25994, cycle.call(null, s__25994))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__25995 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__25996 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__25995.call(this, n);
      case 2:
        return repeat__25996.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__25998 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__25999 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__25998.call(this, n);
      case 2:
        return repeatedly__25999.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__26005 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__26001 = cljs.core.seq.call(null, c1);
      var s2__26002 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____26003 = s1__26001;
        if(cljs.core.truth_(and__3546__auto____26003)) {
          return s2__26002
        }else {
          return and__3546__auto____26003
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__26001), cljs.core.cons.call(null, cljs.core.first.call(null, s2__26002), interleave.call(null, cljs.core.rest.call(null, s1__26001), cljs.core.rest.call(null, s2__26002))))
      }else {
        return null
      }
    })
  };
  var interleave__26006 = function() {
    var G__26008__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__26004 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__26004))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__26004), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__26004)))
        }else {
          return null
        }
      })
    };
    var G__26008 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__26008__delegate.call(this, c1, c2, colls)
    };
    G__26008.cljs$lang$maxFixedArity = 2;
    G__26008.cljs$lang$applyTo = function(arglist__26009) {
      var c1 = cljs.core.first(arglist__26009);
      var c2 = cljs.core.first(cljs.core.next(arglist__26009));
      var colls = cljs.core.rest(cljs.core.next(arglist__26009));
      return G__26008__delegate.call(this, c1, c2, colls)
    };
    return G__26008
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__26005.call(this, c1, c2);
      default:
        return interleave__26006.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__26006.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__26012 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____26010 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____26010)) {
        var coll__26011 = temp__3695__auto____26010;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__26011), cat.call(null, cljs.core.rest.call(null, coll__26011), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__26012.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__26013 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__26014 = function() {
    var G__26016__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__26016 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__26016__delegate.call(this, f, coll, colls)
    };
    G__26016.cljs$lang$maxFixedArity = 2;
    G__26016.cljs$lang$applyTo = function(arglist__26017) {
      var f = cljs.core.first(arglist__26017);
      var coll = cljs.core.first(cljs.core.next(arglist__26017));
      var colls = cljs.core.rest(cljs.core.next(arglist__26017));
      return G__26016__delegate.call(this, f, coll, colls)
    };
    return G__26016
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__26013.call(this, f, coll);
      default:
        return mapcat__26014.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__26014.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____26018 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____26018)) {
      var s__26019 = temp__3698__auto____26018;
      var f__26020 = cljs.core.first.call(null, s__26019);
      var r__26021 = cljs.core.rest.call(null, s__26019);
      if(cljs.core.truth_(pred.call(null, f__26020))) {
        return cljs.core.cons.call(null, f__26020, filter.call(null, pred, r__26021))
      }else {
        return filter.call(null, pred, r__26021)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__26023 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__26023.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__26022_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__26022_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__26030 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__26031 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____26024 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____26024)) {
        var s__26025 = temp__3698__auto____26024;
        var p__26026 = cljs.core.take.call(null, n, s__26025);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__26026)))) {
          return cljs.core.cons.call(null, p__26026, partition.call(null, n, step, cljs.core.drop.call(null, step, s__26025)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__26032 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____26027 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____26027)) {
        var s__26028 = temp__3698__auto____26027;
        var p__26029 = cljs.core.take.call(null, n, s__26028);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__26029)))) {
          return cljs.core.cons.call(null, p__26029, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__26028)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__26029, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__26030.call(this, n, step);
      case 3:
        return partition__26031.call(this, n, step, pad);
      case 4:
        return partition__26032.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__26038 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__26039 = function(m, ks, not_found) {
    var sentinel__26034 = cljs.core.lookup_sentinel;
    var m__26035 = m;
    var ks__26036 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__26036)) {
        var m__26037 = cljs.core.get.call(null, m__26035, cljs.core.first.call(null, ks__26036), sentinel__26034);
        if(cljs.core.truth_(sentinel__26034 === m__26037)) {
          return not_found
        }else {
          var G__26041 = sentinel__26034;
          var G__26042 = m__26037;
          var G__26043 = cljs.core.next.call(null, ks__26036);
          sentinel__26034 = G__26041;
          m__26035 = G__26042;
          ks__26036 = G__26043;
          continue
        }
      }else {
        return m__26035
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__26038.call(this, m, ks);
      case 3:
        return get_in__26039.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__26044, v) {
  var vec__26045__26046 = p__26044;
  var k__26047 = cljs.core.nth.call(null, vec__26045__26046, 0, null);
  var ks__26048 = cljs.core.nthnext.call(null, vec__26045__26046, 1);
  if(cljs.core.truth_(ks__26048)) {
    return cljs.core.assoc.call(null, m, k__26047, assoc_in.call(null, cljs.core.get.call(null, m, k__26047), ks__26048, v))
  }else {
    return cljs.core.assoc.call(null, m, k__26047, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__26049, f, args) {
    var vec__26050__26051 = p__26049;
    var k__26052 = cljs.core.nth.call(null, vec__26050__26051, 0, null);
    var ks__26053 = cljs.core.nthnext.call(null, vec__26050__26051, 1);
    if(cljs.core.truth_(ks__26053)) {
      return cljs.core.assoc.call(null, m, k__26052, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__26052), ks__26053, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__26052, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__26052), args))
    }
  };
  var update_in = function(m, p__26049, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__26049, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__26054) {
    var m = cljs.core.first(arglist__26054);
    var p__26049 = cljs.core.first(cljs.core.next(arglist__26054));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__26054)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__26054)));
    return update_in__delegate.call(this, m, p__26049, f, args)
  };
  return update_in
}();
cljs.core.Vector = function(meta, array) {
  this.meta = meta;
  this.array = array
};
cljs.core.Vector.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__26055 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__26088 = null;
  var G__26088__26089 = function(coll, k) {
    var this__26056 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__26088__26090 = function(coll, k, not_found) {
    var this__26057 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__26088 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26088__26089.call(this, coll, k);
      case 3:
        return G__26088__26090.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26088
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__26058 = this;
  var new_array__26059 = cljs.core.aclone.call(null, this__26058.array);
  new_array__26059[k] = v;
  return new cljs.core.Vector(this__26058.meta, new_array__26059)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__26092 = null;
  var G__26092__26093 = function(tsym26060, k) {
    var this__26062 = this;
    var tsym26060__26063 = this;
    var coll__26064 = tsym26060__26063;
    return cljs.core._lookup.call(null, coll__26064, k)
  };
  var G__26092__26094 = function(tsym26061, k, not_found) {
    var this__26065 = this;
    var tsym26061__26066 = this;
    var coll__26067 = tsym26061__26066;
    return cljs.core._lookup.call(null, coll__26067, k, not_found)
  };
  G__26092 = function(tsym26061, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26092__26093.call(this, tsym26061, k);
      case 3:
        return G__26092__26094.call(this, tsym26061, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26092
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__26068 = this;
  var new_array__26069 = cljs.core.aclone.call(null, this__26068.array);
  new_array__26069.push(o);
  return new cljs.core.Vector(this__26068.meta, new_array__26069)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__26096 = null;
  var G__26096__26097 = function(v, f) {
    var this__26070 = this;
    return cljs.core.ci_reduce.call(null, this__26070.array, f)
  };
  var G__26096__26098 = function(v, f, start) {
    var this__26071 = this;
    return cljs.core.ci_reduce.call(null, this__26071.array, f, start)
  };
  G__26096 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__26096__26097.call(this, v, f);
      case 3:
        return G__26096__26098.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26096
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__26072 = this;
  if(cljs.core.truth_(this__26072.array.length > 0)) {
    var vector_seq__26073 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__26072.array.length)) {
          return cljs.core.cons.call(null, this__26072.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__26073.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__26074 = this;
  return this__26074.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__26075 = this;
  var count__26076 = this__26075.array.length;
  if(cljs.core.truth_(count__26076 > 0)) {
    return this__26075.array[count__26076 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__26077 = this;
  if(cljs.core.truth_(this__26077.array.length > 0)) {
    var new_array__26078 = cljs.core.aclone.call(null, this__26077.array);
    new_array__26078.pop();
    return new cljs.core.Vector(this__26077.meta, new_array__26078)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__26079 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__26080 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__26081 = this;
  return new cljs.core.Vector(meta, this__26081.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__26082 = this;
  return this__26082.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__26100 = null;
  var G__26100__26101 = function(coll, n) {
    var this__26083 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____26084 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____26084)) {
        return n < this__26083.array.length
      }else {
        return and__3546__auto____26084
      }
    }())) {
      return this__26083.array[n]
    }else {
      return null
    }
  };
  var G__26100__26102 = function(coll, n, not_found) {
    var this__26085 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____26086 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____26086)) {
        return n < this__26085.array.length
      }else {
        return and__3546__auto____26086
      }
    }())) {
      return this__26085.array[n]
    }else {
      return not_found
    }
  };
  G__26100 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26100__26101.call(this, coll, n);
      case 3:
        return G__26100__26102.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26100
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__26087 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__26087.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, []);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs)
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__26104 = pv.cnt;
  if(cljs.core.truth_(cnt__26104 < 32)) {
    return 0
  }else {
    return cnt__26104 - 1 >> 5 << 5
  }
};
cljs.core.new_path = function new_path(level, node) {
  var ll__26105 = level;
  var ret__26106 = node;
  while(true) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, ll__26105))) {
      return ret__26106
    }else {
      var embed__26107 = ret__26106;
      var r__26108 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      var ___26109 = r__26108[0] = embed__26107;
      var G__26110 = ll__26105 - 5;
      var G__26111 = r__26108;
      ll__26105 = G__26110;
      ret__26106 = G__26111;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__26112 = cljs.core.aclone.call(null, parent);
  var subidx__26113 = pv.cnt - 1 >> level & 31;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 5, level))) {
    ret__26112[subidx__26113] = tailnode;
    return ret__26112
  }else {
    var temp__3695__auto____26114 = parent[subidx__26113];
    if(cljs.core.truth_(temp__3695__auto____26114)) {
      var child__26115 = temp__3695__auto____26114;
      var node_to_insert__26116 = push_tail.call(null, pv, level - 5, child__26115, tailnode);
      var ___26117 = ret__26112[subidx__26113] = node_to_insert__26116;
      return ret__26112
    }else {
      var node_to_insert__26118 = cljs.core.new_path.call(null, level - 5, tailnode);
      var ___26119 = ret__26112[subidx__26113] = node_to_insert__26118;
      return ret__26112
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____26120 = 0 <= i;
    if(cljs.core.truth_(and__3546__auto____26120)) {
      return i < pv.cnt
    }else {
      return and__3546__auto____26120
    }
  }())) {
    if(cljs.core.truth_(i >= cljs.core.tail_off.call(null, pv))) {
      return pv.tail
    }else {
      var node__26121 = pv.root;
      var level__26122 = pv.shift;
      while(true) {
        if(cljs.core.truth_(level__26122 > 0)) {
          var G__26123 = node__26121[i >> level__26122 & 31];
          var G__26124 = level__26122 - 5;
          node__26121 = G__26123;
          level__26122 = G__26124;
          continue
        }else {
          return node__26121
        }
        break
      }
    }
  }else {
    throw new Error(cljs.core.str.call(null, "No item ", i, " in vector of length ", pv.cnt));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__26125 = cljs.core.aclone.call(null, node);
  if(cljs.core.truth_(level === 0)) {
    ret__26125[i & 31] = val;
    return ret__26125
  }else {
    var subidx__26126 = i >> level & 31;
    var ___26127 = ret__26125[subidx__26126] = do_assoc.call(null, pv, level - 5, node[subidx__26126], i, val);
    return ret__26125
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__26128 = pv.cnt - 2 >> level & 31;
  if(cljs.core.truth_(level > 5)) {
    var new_child__26129 = pop_tail.call(null, pv, level - 5, node[subidx__26128]);
    if(cljs.core.truth_(function() {
      var and__3546__auto____26130 = new_child__26129 === null;
      if(cljs.core.truth_(and__3546__auto____26130)) {
        return subidx__26128 === 0
      }else {
        return and__3546__auto____26130
      }
    }())) {
      return null
    }else {
      var ret__26131 = cljs.core.aclone.call(null, node);
      var ___26132 = ret__26131[subidx__26128] = new_child__26129;
      return ret__26131
    }
  }else {
    if(cljs.core.truth_(subidx__26128 === 0)) {
      return null
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        var ret__26133 = cljs.core.aclone.call(null, node);
        var ___26134 = ret__26133[subidx__26128] = null;
        return ret__26133
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail
};
cljs.core.PersistentVector.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__26135 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__26175 = null;
  var G__26175__26176 = function(coll, k) {
    var this__26136 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__26175__26177 = function(coll, k, not_found) {
    var this__26137 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__26175 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26175__26176.call(this, coll, k);
      case 3:
        return G__26175__26177.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26175
}();
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__26138 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____26139 = 0 <= k;
    if(cljs.core.truth_(and__3546__auto____26139)) {
      return k < this__26138.cnt
    }else {
      return and__3546__auto____26139
    }
  }())) {
    if(cljs.core.truth_(cljs.core.tail_off.call(null, coll) <= k)) {
      var new_tail__26140 = cljs.core.aclone.call(null, this__26138.tail);
      new_tail__26140[k & 31] = v;
      return new cljs.core.PersistentVector(this__26138.meta, this__26138.cnt, this__26138.shift, this__26138.root, new_tail__26140)
    }else {
      return new cljs.core.PersistentVector(this__26138.meta, this__26138.cnt, this__26138.shift, cljs.core.do_assoc.call(null, coll, this__26138.shift, this__26138.root, k, v), this__26138.tail)
    }
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, k, this__26138.cnt))) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Index ", k, " out of bounds  [0,", this__26138.cnt, "]"));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__26179 = null;
  var G__26179__26180 = function(tsym26141, k) {
    var this__26143 = this;
    var tsym26141__26144 = this;
    var coll__26145 = tsym26141__26144;
    return cljs.core._lookup.call(null, coll__26145, k)
  };
  var G__26179__26181 = function(tsym26142, k, not_found) {
    var this__26146 = this;
    var tsym26142__26147 = this;
    var coll__26148 = tsym26142__26147;
    return cljs.core._lookup.call(null, coll__26148, k, not_found)
  };
  G__26179 = function(tsym26142, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26179__26180.call(this, tsym26142, k);
      case 3:
        return G__26179__26181.call(this, tsym26142, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26179
}();
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__26149 = this;
  if(cljs.core.truth_(this__26149.cnt - cljs.core.tail_off.call(null, coll) < 32)) {
    var new_tail__26150 = cljs.core.aclone.call(null, this__26149.tail);
    new_tail__26150.push(o);
    return new cljs.core.PersistentVector(this__26149.meta, this__26149.cnt + 1, this__26149.shift, this__26149.root, new_tail__26150)
  }else {
    var root_overflow_QMARK___26151 = this__26149.cnt >> 5 > 1 << this__26149.shift;
    var new_shift__26152 = cljs.core.truth_(root_overflow_QMARK___26151) ? this__26149.shift + 5 : this__26149.shift;
    var new_root__26154 = cljs.core.truth_(root_overflow_QMARK___26151) ? function() {
      var n_r__26153 = cljs.core.aclone.call(null, cljs.core.PersistentVector.EMPTY_NODE);
      n_r__26153[0] = this__26149.root;
      n_r__26153[1] = cljs.core.new_path.call(null, this__26149.shift, this__26149.tail);
      return n_r__26153
    }() : cljs.core.push_tail.call(null, coll, this__26149.shift, this__26149.root, this__26149.tail);
    return new cljs.core.PersistentVector(this__26149.meta, this__26149.cnt + 1, new_shift__26152, new_root__26154, [o])
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__26183 = null;
  var G__26183__26184 = function(v, f) {
    var this__26155 = this;
    return cljs.core.ci_reduce.call(null, v, f)
  };
  var G__26183__26185 = function(v, f, start) {
    var this__26156 = this;
    return cljs.core.ci_reduce.call(null, v, f, start)
  };
  G__26183 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__26183__26184.call(this, v, f);
      case 3:
        return G__26183__26185.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26183
}();
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__26157 = this;
  if(cljs.core.truth_(this__26157.cnt > 0)) {
    var vector_seq__26158 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__26157.cnt)) {
          return cljs.core.cons.call(null, cljs.core._nth.call(null, coll, i), vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__26158.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__26159 = this;
  return this__26159.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__26160 = this;
  if(cljs.core.truth_(this__26160.cnt > 0)) {
    return cljs.core._nth.call(null, coll, this__26160.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__26161 = this;
  if(cljs.core.truth_(this__26161.cnt === 0)) {
    throw new Error("Can't pop empty vector");
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 1, this__26161.cnt))) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__26161.meta)
    }else {
      if(cljs.core.truth_(1 < this__26161.cnt - cljs.core.tail_off.call(null, coll))) {
        return new cljs.core.PersistentVector(this__26161.meta, this__26161.cnt - 1, this__26161.shift, this__26161.root, cljs.core.aclone.call(null, this__26161.tail))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          var new_tail__26162 = cljs.core.array_for.call(null, coll, this__26161.cnt - 2);
          var nr__26163 = cljs.core.pop_tail.call(null, this__26161.shift, this__26161.root);
          var new_root__26164 = cljs.core.truth_(nr__26163 === null) ? cljs.core.PersistentVector.EMPTY_NODE : nr__26163;
          var cnt_1__26165 = this__26161.cnt - 1;
          if(cljs.core.truth_(function() {
            var and__3546__auto____26166 = 5 < this__26161.shift;
            if(cljs.core.truth_(and__3546__auto____26166)) {
              return new_root__26164[1] === null
            }else {
              return and__3546__auto____26166
            }
          }())) {
            return new cljs.core.PersistentVector(this__26161.meta, cnt_1__26165, this__26161.shift - 5, new_root__26164[0], new_tail__26162)
          }else {
            return new cljs.core.PersistentVector(this__26161.meta, cnt_1__26165, this__26161.shift, new_root__26164, new_tail__26162)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__26167 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__26168 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__26169 = this;
  return new cljs.core.PersistentVector(meta, this__26169.cnt, this__26169.shift, this__26169.root, this__26169.tail)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__26170 = this;
  return this__26170.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__26187 = null;
  var G__26187__26188 = function(coll, n) {
    var this__26171 = this;
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  };
  var G__26187__26189 = function(coll, n, not_found) {
    var this__26172 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____26173 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____26173)) {
        return n < this__26172.cnt
      }else {
        return and__3546__auto____26173
      }
    }())) {
      return cljs.core._nth.call(null, coll, n)
    }else {
      return not_found
    }
  };
  G__26187 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26187__26188.call(this, coll, n);
      case 3:
        return G__26187__26189.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26187
}();
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__26174 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__26174.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = new Array(32);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, []);
cljs.core.PersistentVector.fromArray = function(xs) {
  return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, xs)
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.PersistentVector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__26191) {
    var args = cljs.core.seq(arglist__26191);
    return vector__delegate.call(this, args)
  };
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end
};
cljs.core.Subvec.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__26192 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__26220 = null;
  var G__26220__26221 = function(coll, k) {
    var this__26193 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__26220__26222 = function(coll, k, not_found) {
    var this__26194 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__26220 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26220__26221.call(this, coll, k);
      case 3:
        return G__26220__26222.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26220
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__26195 = this;
  var v_pos__26196 = this__26195.start + key;
  return new cljs.core.Subvec(this__26195.meta, cljs.core._assoc.call(null, this__26195.v, v_pos__26196, val), this__26195.start, this__26195.end > v_pos__26196 + 1 ? this__26195.end : v_pos__26196 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__26224 = null;
  var G__26224__26225 = function(tsym26197, k) {
    var this__26199 = this;
    var tsym26197__26200 = this;
    var coll__26201 = tsym26197__26200;
    return cljs.core._lookup.call(null, coll__26201, k)
  };
  var G__26224__26226 = function(tsym26198, k, not_found) {
    var this__26202 = this;
    var tsym26198__26203 = this;
    var coll__26204 = tsym26198__26203;
    return cljs.core._lookup.call(null, coll__26204, k, not_found)
  };
  G__26224 = function(tsym26198, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26224__26225.call(this, tsym26198, k);
      case 3:
        return G__26224__26226.call(this, tsym26198, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26224
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__26205 = this;
  return new cljs.core.Subvec(this__26205.meta, cljs.core._assoc_n.call(null, this__26205.v, this__26205.end, o), this__26205.start, this__26205.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__26228 = null;
  var G__26228__26229 = function(coll, f) {
    var this__26206 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__26228__26230 = function(coll, f, start) {
    var this__26207 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__26228 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__26228__26229.call(this, coll, f);
      case 3:
        return G__26228__26230.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26228
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__26208 = this;
  var subvec_seq__26209 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__26208.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__26208.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__26209.call(null, this__26208.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__26210 = this;
  return this__26210.end - this__26210.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__26211 = this;
  return cljs.core._nth.call(null, this__26211.v, this__26211.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__26212 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__26212.start, this__26212.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__26212.meta, this__26212.v, this__26212.start, this__26212.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__26213 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__26214 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__26215 = this;
  return new cljs.core.Subvec(meta, this__26215.v, this__26215.start, this__26215.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__26216 = this;
  return this__26216.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__26232 = null;
  var G__26232__26233 = function(coll, n) {
    var this__26217 = this;
    return cljs.core._nth.call(null, this__26217.v, this__26217.start + n)
  };
  var G__26232__26234 = function(coll, n, not_found) {
    var this__26218 = this;
    return cljs.core._nth.call(null, this__26218.v, this__26218.start + n, not_found)
  };
  G__26232 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26232__26233.call(this, coll, n);
      case 3:
        return G__26232__26234.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26232
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__26219 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__26219.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__26236 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__26237 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__26236.call(this, v, start);
      case 3:
        return subvec__26237.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subvec
}();
cljs.core.PersistentQueueSeq = function(meta, front, rear) {
  this.meta = meta;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueueSeq.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__26239 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__26240 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__26241 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__26242 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__26242.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__26243 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__26244 = this;
  return cljs.core._first.call(null, this__26244.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__26245 = this;
  var temp__3695__auto____26246 = cljs.core.next.call(null, this__26245.front);
  if(cljs.core.truth_(temp__3695__auto____26246)) {
    var f1__26247 = temp__3695__auto____26246;
    return new cljs.core.PersistentQueueSeq(this__26245.meta, f1__26247, this__26245.rear)
  }else {
    if(cljs.core.truth_(this__26245.rear === null)) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__26245.meta, this__26245.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__26248 = this;
  return this__26248.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__26249 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__26249.front, this__26249.rear)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueue.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__26250 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__26251 = this;
  if(cljs.core.truth_(this__26251.front)) {
    return new cljs.core.PersistentQueue(this__26251.meta, this__26251.count + 1, this__26251.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____26252 = this__26251.rear;
      if(cljs.core.truth_(or__3548__auto____26252)) {
        return or__3548__auto____26252
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__26251.meta, this__26251.count + 1, cljs.core.conj.call(null, this__26251.front, o), cljs.core.PersistentVector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__26253 = this;
  var rear__26254 = cljs.core.seq.call(null, this__26253.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____26255 = this__26253.front;
    if(cljs.core.truth_(or__3548__auto____26255)) {
      return or__3548__auto____26255
    }else {
      return rear__26254
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__26253.front, cljs.core.seq.call(null, rear__26254))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__26256 = this;
  return this__26256.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__26257 = this;
  return cljs.core._first.call(null, this__26257.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__26258 = this;
  if(cljs.core.truth_(this__26258.front)) {
    var temp__3695__auto____26259 = cljs.core.next.call(null, this__26258.front);
    if(cljs.core.truth_(temp__3695__auto____26259)) {
      var f1__26260 = temp__3695__auto____26259;
      return new cljs.core.PersistentQueue(this__26258.meta, this__26258.count - 1, f1__26260, this__26258.rear)
    }else {
      return new cljs.core.PersistentQueue(this__26258.meta, this__26258.count - 1, cljs.core.seq.call(null, this__26258.rear), cljs.core.PersistentVector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__26261 = this;
  return cljs.core.first.call(null, this__26261.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__26262 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__26263 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__26264 = this;
  return new cljs.core.PersistentQueue(meta, this__26264.count, this__26264.front, this__26264.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__26265 = this;
  return this__26265.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__26266 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]));
cljs.core.NeverEquiv = function() {
};
cljs.core.NeverEquiv.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__26267 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.map_QMARK_.call(null, y)) ? cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, x), cljs.core.count.call(null, y))) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__26268 = array.length;
  var i__26269 = 0;
  while(true) {
    if(cljs.core.truth_(i__26269 < len__26268)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__26269]))) {
        return i__26269
      }else {
        var G__26270 = i__26269 + incr;
        i__26269 = G__26270;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___26272 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___26273 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____26271 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____26271)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____26271
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___26272.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___26273.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__26276 = cljs.core.hash.call(null, a);
  var b__26277 = cljs.core.hash.call(null, b);
  if(cljs.core.truth_(a__26276 < b__26277)) {
    return-1
  }else {
    if(cljs.core.truth_(a__26276 > b__26277)) {
      return 1
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.ObjMap = function(meta, keys, strobj) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj
};
cljs.core.ObjMap.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__26278 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__26305 = null;
  var G__26305__26306 = function(coll, k) {
    var this__26279 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__26305__26307 = function(coll, k, not_found) {
    var this__26280 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__26280.strobj, this__26280.strobj[k], not_found)
  };
  G__26305 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26305__26306.call(this, coll, k);
      case 3:
        return G__26305__26307.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26305
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__26281 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__26282 = goog.object.clone.call(null, this__26281.strobj);
    var overwrite_QMARK___26283 = new_strobj__26282.hasOwnProperty(k);
    new_strobj__26282[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___26283)) {
      return new cljs.core.ObjMap(this__26281.meta, this__26281.keys, new_strobj__26282)
    }else {
      var new_keys__26284 = cljs.core.aclone.call(null, this__26281.keys);
      new_keys__26284.push(k);
      return new cljs.core.ObjMap(this__26281.meta, new_keys__26284, new_strobj__26282)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__26281.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__26285 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__26285.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__26309 = null;
  var G__26309__26310 = function(tsym26286, k) {
    var this__26288 = this;
    var tsym26286__26289 = this;
    var coll__26290 = tsym26286__26289;
    return cljs.core._lookup.call(null, coll__26290, k)
  };
  var G__26309__26311 = function(tsym26287, k, not_found) {
    var this__26291 = this;
    var tsym26287__26292 = this;
    var coll__26293 = tsym26287__26292;
    return cljs.core._lookup.call(null, coll__26293, k, not_found)
  };
  G__26309 = function(tsym26287, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26309__26310.call(this, tsym26287, k);
      case 3:
        return G__26309__26311.call(this, tsym26287, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26309
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__26294 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__26295 = this;
  if(cljs.core.truth_(this__26295.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__26275_SHARP_) {
      return cljs.core.vector.call(null, p1__26275_SHARP_, this__26295.strobj[p1__26275_SHARP_])
    }, this__26295.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__26296 = this;
  return this__26296.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__26297 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__26298 = this;
  return new cljs.core.ObjMap(meta, this__26298.keys, this__26298.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__26299 = this;
  return this__26299.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__26300 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__26300.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__26301 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____26302 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____26302)) {
      return this__26301.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____26302
    }
  }())) {
    var new_keys__26303 = cljs.core.aclone.call(null, this__26301.keys);
    var new_strobj__26304 = goog.object.clone.call(null, this__26301.strobj);
    new_keys__26303.splice(cljs.core.scan_array.call(null, 1, k, new_keys__26303), 1);
    cljs.core.js_delete.call(null, new_strobj__26304, k);
    return new cljs.core.ObjMap(this__26301.meta, new_keys__26303, new_strobj__26304)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], cljs.core.js_obj.call(null));
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj)
};
cljs.core.HashMap = function(meta, count, hashobj) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj
};
cljs.core.HashMap.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__26314 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__26352 = null;
  var G__26352__26353 = function(coll, k) {
    var this__26315 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__26352__26354 = function(coll, k, not_found) {
    var this__26316 = this;
    var bucket__26317 = this__26316.hashobj[cljs.core.hash.call(null, k)];
    var i__26318 = cljs.core.truth_(bucket__26317) ? cljs.core.scan_array.call(null, 2, k, bucket__26317) : null;
    if(cljs.core.truth_(i__26318)) {
      return bucket__26317[i__26318 + 1]
    }else {
      return not_found
    }
  };
  G__26352 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26352__26353.call(this, coll, k);
      case 3:
        return G__26352__26354.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26352
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__26319 = this;
  var h__26320 = cljs.core.hash.call(null, k);
  var bucket__26321 = this__26319.hashobj[h__26320];
  if(cljs.core.truth_(bucket__26321)) {
    var new_bucket__26322 = cljs.core.aclone.call(null, bucket__26321);
    var new_hashobj__26323 = goog.object.clone.call(null, this__26319.hashobj);
    new_hashobj__26323[h__26320] = new_bucket__26322;
    var temp__3695__auto____26324 = cljs.core.scan_array.call(null, 2, k, new_bucket__26322);
    if(cljs.core.truth_(temp__3695__auto____26324)) {
      var i__26325 = temp__3695__auto____26324;
      new_bucket__26322[i__26325 + 1] = v;
      return new cljs.core.HashMap(this__26319.meta, this__26319.count, new_hashobj__26323)
    }else {
      new_bucket__26322.push(k, v);
      return new cljs.core.HashMap(this__26319.meta, this__26319.count + 1, new_hashobj__26323)
    }
  }else {
    var new_hashobj__26326 = goog.object.clone.call(null, this__26319.hashobj);
    new_hashobj__26326[h__26320] = [k, v];
    return new cljs.core.HashMap(this__26319.meta, this__26319.count + 1, new_hashobj__26326)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__26327 = this;
  var bucket__26328 = this__26327.hashobj[cljs.core.hash.call(null, k)];
  var i__26329 = cljs.core.truth_(bucket__26328) ? cljs.core.scan_array.call(null, 2, k, bucket__26328) : null;
  if(cljs.core.truth_(i__26329)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__26356 = null;
  var G__26356__26357 = function(tsym26330, k) {
    var this__26332 = this;
    var tsym26330__26333 = this;
    var coll__26334 = tsym26330__26333;
    return cljs.core._lookup.call(null, coll__26334, k)
  };
  var G__26356__26358 = function(tsym26331, k, not_found) {
    var this__26335 = this;
    var tsym26331__26336 = this;
    var coll__26337 = tsym26331__26336;
    return cljs.core._lookup.call(null, coll__26337, k, not_found)
  };
  G__26356 = function(tsym26331, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26356__26357.call(this, tsym26331, k);
      case 3:
        return G__26356__26358.call(this, tsym26331, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26356
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__26338 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__26339 = this;
  if(cljs.core.truth_(this__26339.count > 0)) {
    var hashes__26340 = cljs.core.js_keys.call(null, this__26339.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__26313_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__26339.hashobj[p1__26313_SHARP_]))
    }, hashes__26340)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__26341 = this;
  return this__26341.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__26342 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__26343 = this;
  return new cljs.core.HashMap(meta, this__26343.count, this__26343.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__26344 = this;
  return this__26344.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__26345 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__26345.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__26346 = this;
  var h__26347 = cljs.core.hash.call(null, k);
  var bucket__26348 = this__26346.hashobj[h__26347];
  var i__26349 = cljs.core.truth_(bucket__26348) ? cljs.core.scan_array.call(null, 2, k, bucket__26348) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__26349))) {
    return coll
  }else {
    var new_hashobj__26350 = goog.object.clone.call(null, this__26346.hashobj);
    if(cljs.core.truth_(3 > bucket__26348.length)) {
      cljs.core.js_delete.call(null, new_hashobj__26350, h__26347)
    }else {
      var new_bucket__26351 = cljs.core.aclone.call(null, bucket__26348);
      new_bucket__26351.splice(i__26349, 2);
      new_hashobj__26350[h__26347] = new_bucket__26351
    }
    return new cljs.core.HashMap(this__26346.meta, this__26346.count - 1, new_hashobj__26350)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__26360 = ks.length;
  var i__26361 = 0;
  var out__26362 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__26361 < len__26360)) {
      var G__26363 = i__26361 + 1;
      var G__26364 = cljs.core.assoc.call(null, out__26362, ks[i__26361], vs[i__26361]);
      i__26361 = G__26363;
      out__26362 = G__26364;
      continue
    }else {
      return out__26362
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__26365 = cljs.core.seq.call(null, keyvals);
    var out__26366 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__26365)) {
        var G__26367 = cljs.core.nnext.call(null, in$__26365);
        var G__26368 = cljs.core.assoc.call(null, out__26366, cljs.core.first.call(null, in$__26365), cljs.core.second.call(null, in$__26365));
        in$__26365 = G__26367;
        out__26366 = G__26368;
        continue
      }else {
        return out__26366
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__26369) {
    var keyvals = cljs.core.seq(arglist__26369);
    return hash_map__delegate.call(this, keyvals)
  };
  return hash_map
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__26370_SHARP_, p2__26371_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____26372 = p1__26370_SHARP_;
          if(cljs.core.truth_(or__3548__auto____26372)) {
            return or__3548__auto____26372
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__26371_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__26373) {
    var maps = cljs.core.seq(arglist__26373);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__26376 = function(m, e) {
        var k__26374 = cljs.core.first.call(null, e);
        var v__26375 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__26374))) {
          return cljs.core.assoc.call(null, m, k__26374, f.call(null, cljs.core.get.call(null, m, k__26374), v__26375))
        }else {
          return cljs.core.assoc.call(null, m, k__26374, v__26375)
        }
      };
      var merge2__26378 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__26376, function() {
          var or__3548__auto____26377 = m1;
          if(cljs.core.truth_(or__3548__auto____26377)) {
            return or__3548__auto____26377
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__26378, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__26379) {
    var f = cljs.core.first(arglist__26379);
    var maps = cljs.core.rest(arglist__26379);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__26381 = cljs.core.ObjMap.fromObject([], {});
  var keys__26382 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__26382)) {
      var key__26383 = cljs.core.first.call(null, keys__26382);
      var entry__26384 = cljs.core.get.call(null, map, key__26383, "\ufdd0'user/not-found");
      var G__26385 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__26384, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__26381, key__26383, entry__26384) : ret__26381;
      var G__26386 = cljs.core.next.call(null, keys__26382);
      ret__26381 = G__26385;
      keys__26382 = G__26386;
      continue
    }else {
      return ret__26381
    }
    break
  }
};
cljs.core.Set = function(meta, hash_map) {
  this.meta = meta;
  this.hash_map = hash_map
};
cljs.core.Set.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Set")
};
cljs.core.Set.prototype.cljs$core$IHash$ = true;
cljs.core.Set.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__26387 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__26408 = null;
  var G__26408__26409 = function(coll, v) {
    var this__26388 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__26408__26410 = function(coll, v, not_found) {
    var this__26389 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__26389.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__26408 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26408__26409.call(this, coll, v);
      case 3:
        return G__26408__26410.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26408
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__26412 = null;
  var G__26412__26413 = function(tsym26390, k) {
    var this__26392 = this;
    var tsym26390__26393 = this;
    var coll__26394 = tsym26390__26393;
    return cljs.core._lookup.call(null, coll__26394, k)
  };
  var G__26412__26414 = function(tsym26391, k, not_found) {
    var this__26395 = this;
    var tsym26391__26396 = this;
    var coll__26397 = tsym26391__26396;
    return cljs.core._lookup.call(null, coll__26397, k, not_found)
  };
  G__26412 = function(tsym26391, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26412__26413.call(this, tsym26391, k);
      case 3:
        return G__26412__26414.call(this, tsym26391, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26412
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__26398 = this;
  return new cljs.core.Set(this__26398.meta, cljs.core.assoc.call(null, this__26398.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__26399 = this;
  return cljs.core.keys.call(null, this__26399.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__26400 = this;
  return new cljs.core.Set(this__26400.meta, cljs.core.dissoc.call(null, this__26400.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__26401 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__26402 = this;
  var and__3546__auto____26403 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3546__auto____26403)) {
    var and__3546__auto____26404 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3546__auto____26404)) {
      return cljs.core.every_QMARK_.call(null, function(p1__26380_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__26380_SHARP_)
      }, other)
    }else {
      return and__3546__auto____26404
    }
  }else {
    return and__3546__auto____26403
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__26405 = this;
  return new cljs.core.Set(meta, this__26405.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__26406 = this;
  return this__26406.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__26407 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__26407.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__26417 = cljs.core.seq.call(null, coll);
  var out__26418 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__26417)))) {
      var G__26419 = cljs.core.rest.call(null, in$__26417);
      var G__26420 = cljs.core.conj.call(null, out__26418, cljs.core.first.call(null, in$__26417));
      in$__26417 = G__26419;
      out__26418 = G__26420;
      continue
    }else {
      return out__26418
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__26421 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____26422 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____26422)) {
        var e__26423 = temp__3695__auto____26422;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__26423))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__26421, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__26416_SHARP_) {
      var temp__3695__auto____26424 = cljs.core.find.call(null, smap, p1__26416_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____26424)) {
        var e__26425 = temp__3695__auto____26424;
        return cljs.core.second.call(null, e__26425)
      }else {
        return p1__26416_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__26433 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__26426, seen) {
        while(true) {
          var vec__26427__26428 = p__26426;
          var f__26429 = cljs.core.nth.call(null, vec__26427__26428, 0, null);
          var xs__26430 = vec__26427__26428;
          var temp__3698__auto____26431 = cljs.core.seq.call(null, xs__26430);
          if(cljs.core.truth_(temp__3698__auto____26431)) {
            var s__26432 = temp__3698__auto____26431;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__26429))) {
              var G__26434 = cljs.core.rest.call(null, s__26432);
              var G__26435 = seen;
              p__26426 = G__26434;
              seen = G__26435;
              continue
            }else {
              return cljs.core.cons.call(null, f__26429, step.call(null, cljs.core.rest.call(null, s__26432), cljs.core.conj.call(null, seen, f__26429)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__26433.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__26436 = cljs.core.PersistentVector.fromArray([]);
  var s__26437 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__26437))) {
      var G__26438 = cljs.core.conj.call(null, ret__26436, cljs.core.first.call(null, s__26437));
      var G__26439 = cljs.core.next.call(null, s__26437);
      ret__26436 = G__26438;
      s__26437 = G__26439;
      continue
    }else {
      return cljs.core.seq.call(null, ret__26436)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3548__auto____26440 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3548__auto____26440)) {
        return or__3548__auto____26440
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__26441 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__26441 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__26441 + 1)
      }
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Doesn't support name: ", x));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(cljs.core.truth_(function() {
    var or__3548__auto____26442 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3548__auto____26442)) {
      return or__3548__auto____26442
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__26443 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__26443 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__26443)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__26446 = cljs.core.ObjMap.fromObject([], {});
  var ks__26447 = cljs.core.seq.call(null, keys);
  var vs__26448 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____26449 = ks__26447;
      if(cljs.core.truth_(and__3546__auto____26449)) {
        return vs__26448
      }else {
        return and__3546__auto____26449
      }
    }())) {
      var G__26450 = cljs.core.assoc.call(null, map__26446, cljs.core.first.call(null, ks__26447), cljs.core.first.call(null, vs__26448));
      var G__26451 = cljs.core.next.call(null, ks__26447);
      var G__26452 = cljs.core.next.call(null, vs__26448);
      map__26446 = G__26450;
      ks__26447 = G__26451;
      vs__26448 = G__26452;
      continue
    }else {
      return map__26446
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__26455 = function(k, x) {
    return x
  };
  var max_key__26456 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__26457 = function() {
    var G__26459__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__26444_SHARP_, p2__26445_SHARP_) {
        return max_key.call(null, k, p1__26444_SHARP_, p2__26445_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__26459 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__26459__delegate.call(this, k, x, y, more)
    };
    G__26459.cljs$lang$maxFixedArity = 3;
    G__26459.cljs$lang$applyTo = function(arglist__26460) {
      var k = cljs.core.first(arglist__26460);
      var x = cljs.core.first(cljs.core.next(arglist__26460));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__26460)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__26460)));
      return G__26459__delegate.call(this, k, x, y, more)
    };
    return G__26459
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__26455.call(this, k, x);
      case 3:
        return max_key__26456.call(this, k, x, y);
      default:
        return max_key__26457.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__26457.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__26461 = function(k, x) {
    return x
  };
  var min_key__26462 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__26463 = function() {
    var G__26465__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__26453_SHARP_, p2__26454_SHARP_) {
        return min_key.call(null, k, p1__26453_SHARP_, p2__26454_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__26465 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__26465__delegate.call(this, k, x, y, more)
    };
    G__26465.cljs$lang$maxFixedArity = 3;
    G__26465.cljs$lang$applyTo = function(arglist__26466) {
      var k = cljs.core.first(arglist__26466);
      var x = cljs.core.first(cljs.core.next(arglist__26466));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__26466)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__26466)));
      return G__26465__delegate.call(this, k, x, y, more)
    };
    return G__26465
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__26461.call(this, k, x);
      case 3:
        return min_key__26462.call(this, k, x, y);
      default:
        return min_key__26463.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__26463.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__26469 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__26470 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____26467 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____26467)) {
        var s__26468 = temp__3698__auto____26467;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__26468), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__26468)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__26469.call(this, n, step);
      case 3:
        return partition_all__26470.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____26472 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____26472)) {
      var s__26473 = temp__3698__auto____26472;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__26473)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__26473), take_while.call(null, pred, cljs.core.rest.call(null, s__26473)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.Range = function(meta, start, end, step) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step
};
cljs.core.Range.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash = function(rng) {
  var this__26474 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__26475 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__26491 = null;
  var G__26491__26492 = function(rng, f) {
    var this__26476 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__26491__26493 = function(rng, f, s) {
    var this__26477 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__26491 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__26491__26492.call(this, rng, f);
      case 3:
        return G__26491__26493.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26491
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__26478 = this;
  var comp__26479 = cljs.core.truth_(this__26478.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__26479.call(null, this__26478.start, this__26478.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__26480 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__26480.end - this__26480.start) / this__26480.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__26481 = this;
  return this__26481.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__26482 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__26482.meta, this__26482.start + this__26482.step, this__26482.end, this__26482.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__26483 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__26484 = this;
  return new cljs.core.Range(meta, this__26484.start, this__26484.end, this__26484.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__26485 = this;
  return this__26485.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__26495 = null;
  var G__26495__26496 = function(rng, n) {
    var this__26486 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__26486.start + n * this__26486.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____26487 = this__26486.start > this__26486.end;
        if(cljs.core.truth_(and__3546__auto____26487)) {
          return cljs.core._EQ_.call(null, this__26486.step, 0)
        }else {
          return and__3546__auto____26487
        }
      }())) {
        return this__26486.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__26495__26497 = function(rng, n, not_found) {
    var this__26488 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__26488.start + n * this__26488.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____26489 = this__26488.start > this__26488.end;
        if(cljs.core.truth_(and__3546__auto____26489)) {
          return cljs.core._EQ_.call(null, this__26488.step, 0)
        }else {
          return and__3546__auto____26489
        }
      }())) {
        return this__26488.start
      }else {
        return not_found
      }
    }
  };
  G__26495 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__26495__26496.call(this, rng, n);
      case 3:
        return G__26495__26497.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__26495
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__26490 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__26490.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__26499 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__26500 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__26501 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__26502 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__26499.call(this);
      case 1:
        return range__26500.call(this, start);
      case 2:
        return range__26501.call(this, start, end);
      case 3:
        return range__26502.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____26504 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____26504)) {
      var s__26505 = temp__3698__auto____26504;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__26505), take_nth.call(null, n, cljs.core.drop.call(null, n, s__26505)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____26507 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____26507)) {
      var s__26508 = temp__3698__auto____26507;
      var fst__26509 = cljs.core.first.call(null, s__26508);
      var fv__26510 = f.call(null, fst__26509);
      var run__26511 = cljs.core.cons.call(null, fst__26509, cljs.core.take_while.call(null, function(p1__26506_SHARP_) {
        return cljs.core._EQ_.call(null, fv__26510, f.call(null, p1__26506_SHARP_))
      }, cljs.core.next.call(null, s__26508)));
      return cljs.core.cons.call(null, run__26511, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__26511), s__26508))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__26526 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____26522 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____26522)) {
        var s__26523 = temp__3695__auto____26522;
        return reductions.call(null, f, cljs.core.first.call(null, s__26523), cljs.core.rest.call(null, s__26523))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__26527 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____26524 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____26524)) {
        var s__26525 = temp__3698__auto____26524;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__26525)), cljs.core.rest.call(null, s__26525))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__26526.call(this, f, init);
      case 3:
        return reductions__26527.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__26530 = function(f) {
    return function() {
      var G__26535 = null;
      var G__26535__26536 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__26535__26537 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__26535__26538 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__26535__26539 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__26535__26540 = function() {
        var G__26542__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__26542 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__26542__delegate.call(this, x, y, z, args)
        };
        G__26542.cljs$lang$maxFixedArity = 3;
        G__26542.cljs$lang$applyTo = function(arglist__26543) {
          var x = cljs.core.first(arglist__26543);
          var y = cljs.core.first(cljs.core.next(arglist__26543));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__26543)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__26543)));
          return G__26542__delegate.call(this, x, y, z, args)
        };
        return G__26542
      }();
      G__26535 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__26535__26536.call(this);
          case 1:
            return G__26535__26537.call(this, x);
          case 2:
            return G__26535__26538.call(this, x, y);
          case 3:
            return G__26535__26539.call(this, x, y, z);
          default:
            return G__26535__26540.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__26535.cljs$lang$maxFixedArity = 3;
      G__26535.cljs$lang$applyTo = G__26535__26540.cljs$lang$applyTo;
      return G__26535
    }()
  };
  var juxt__26531 = function(f, g) {
    return function() {
      var G__26544 = null;
      var G__26544__26545 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__26544__26546 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__26544__26547 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__26544__26548 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__26544__26549 = function() {
        var G__26551__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__26551 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__26551__delegate.call(this, x, y, z, args)
        };
        G__26551.cljs$lang$maxFixedArity = 3;
        G__26551.cljs$lang$applyTo = function(arglist__26552) {
          var x = cljs.core.first(arglist__26552);
          var y = cljs.core.first(cljs.core.next(arglist__26552));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__26552)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__26552)));
          return G__26551__delegate.call(this, x, y, z, args)
        };
        return G__26551
      }();
      G__26544 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__26544__26545.call(this);
          case 1:
            return G__26544__26546.call(this, x);
          case 2:
            return G__26544__26547.call(this, x, y);
          case 3:
            return G__26544__26548.call(this, x, y, z);
          default:
            return G__26544__26549.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__26544.cljs$lang$maxFixedArity = 3;
      G__26544.cljs$lang$applyTo = G__26544__26549.cljs$lang$applyTo;
      return G__26544
    }()
  };
  var juxt__26532 = function(f, g, h) {
    return function() {
      var G__26553 = null;
      var G__26553__26554 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__26553__26555 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__26553__26556 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__26553__26557 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__26553__26558 = function() {
        var G__26560__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__26560 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__26560__delegate.call(this, x, y, z, args)
        };
        G__26560.cljs$lang$maxFixedArity = 3;
        G__26560.cljs$lang$applyTo = function(arglist__26561) {
          var x = cljs.core.first(arglist__26561);
          var y = cljs.core.first(cljs.core.next(arglist__26561));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__26561)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__26561)));
          return G__26560__delegate.call(this, x, y, z, args)
        };
        return G__26560
      }();
      G__26553 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__26553__26554.call(this);
          case 1:
            return G__26553__26555.call(this, x);
          case 2:
            return G__26553__26556.call(this, x, y);
          case 3:
            return G__26553__26557.call(this, x, y, z);
          default:
            return G__26553__26558.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__26553.cljs$lang$maxFixedArity = 3;
      G__26553.cljs$lang$applyTo = G__26553__26558.cljs$lang$applyTo;
      return G__26553
    }()
  };
  var juxt__26533 = function() {
    var G__26562__delegate = function(f, g, h, fs) {
      var fs__26529 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__26563 = null;
        var G__26563__26564 = function() {
          return cljs.core.reduce.call(null, function(p1__26512_SHARP_, p2__26513_SHARP_) {
            return cljs.core.conj.call(null, p1__26512_SHARP_, p2__26513_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__26529)
        };
        var G__26563__26565 = function(x) {
          return cljs.core.reduce.call(null, function(p1__26514_SHARP_, p2__26515_SHARP_) {
            return cljs.core.conj.call(null, p1__26514_SHARP_, p2__26515_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__26529)
        };
        var G__26563__26566 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__26516_SHARP_, p2__26517_SHARP_) {
            return cljs.core.conj.call(null, p1__26516_SHARP_, p2__26517_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__26529)
        };
        var G__26563__26567 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__26518_SHARP_, p2__26519_SHARP_) {
            return cljs.core.conj.call(null, p1__26518_SHARP_, p2__26519_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__26529)
        };
        var G__26563__26568 = function() {
          var G__26570__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__26520_SHARP_, p2__26521_SHARP_) {
              return cljs.core.conj.call(null, p1__26520_SHARP_, cljs.core.apply.call(null, p2__26521_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__26529)
          };
          var G__26570 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__26570__delegate.call(this, x, y, z, args)
          };
          G__26570.cljs$lang$maxFixedArity = 3;
          G__26570.cljs$lang$applyTo = function(arglist__26571) {
            var x = cljs.core.first(arglist__26571);
            var y = cljs.core.first(cljs.core.next(arglist__26571));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__26571)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__26571)));
            return G__26570__delegate.call(this, x, y, z, args)
          };
          return G__26570
        }();
        G__26563 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__26563__26564.call(this);
            case 1:
              return G__26563__26565.call(this, x);
            case 2:
              return G__26563__26566.call(this, x, y);
            case 3:
              return G__26563__26567.call(this, x, y, z);
            default:
              return G__26563__26568.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__26563.cljs$lang$maxFixedArity = 3;
        G__26563.cljs$lang$applyTo = G__26563__26568.cljs$lang$applyTo;
        return G__26563
      }()
    };
    var G__26562 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__26562__delegate.call(this, f, g, h, fs)
    };
    G__26562.cljs$lang$maxFixedArity = 3;
    G__26562.cljs$lang$applyTo = function(arglist__26572) {
      var f = cljs.core.first(arglist__26572);
      var g = cljs.core.first(cljs.core.next(arglist__26572));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__26572)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__26572)));
      return G__26562__delegate.call(this, f, g, h, fs)
    };
    return G__26562
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__26530.call(this, f);
      case 2:
        return juxt__26531.call(this, f, g);
      case 3:
        return juxt__26532.call(this, f, g, h);
      default:
        return juxt__26533.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__26533.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__26574 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__26577 = cljs.core.next.call(null, coll);
        coll = G__26577;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__26575 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____26573 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____26573)) {
          return n > 0
        }else {
          return and__3546__auto____26573
        }
      }())) {
        var G__26578 = n - 1;
        var G__26579 = cljs.core.next.call(null, coll);
        n = G__26578;
        coll = G__26579;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__26574.call(this, n);
      case 2:
        return dorun__26575.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__26580 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__26581 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__26580.call(this, n);
      case 2:
        return doall__26581.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__26583 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__26583), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__26583), 1))) {
      return cljs.core.first.call(null, matches__26583)
    }else {
      return cljs.core.vec.call(null, matches__26583)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__26584 = re.exec(s);
  if(cljs.core.truth_(matches__26584 === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__26584), 1))) {
      return cljs.core.first.call(null, matches__26584)
    }else {
      return cljs.core.vec.call(null, matches__26584)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__26585 = cljs.core.re_find.call(null, re, s);
  var match_idx__26586 = s.search(re);
  var match_str__26587 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__26585)) ? cljs.core.first.call(null, match_data__26585) : match_data__26585;
  var post_match__26588 = cljs.core.subs.call(null, s, match_idx__26586 + cljs.core.count.call(null, match_str__26587));
  if(cljs.core.truth_(match_data__26585)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__26585, re_seq.call(null, re, post_match__26588))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__26590__26591 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___26592 = cljs.core.nth.call(null, vec__26590__26591, 0, null);
  var flags__26593 = cljs.core.nth.call(null, vec__26590__26591, 1, null);
  var pattern__26594 = cljs.core.nth.call(null, vec__26590__26591, 2, null);
  return new RegExp(pattern__26594, flags__26593)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__26589_SHARP_) {
    return print_one.call(null, p1__26589_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(cljs.core.truth_(obj === null)) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(cljs.core.truth_(void 0 === obj)) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3546__auto____26595 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____26595)) {
            var and__3546__auto____26599 = function() {
              var x__451__auto____26596 = obj;
              if(cljs.core.truth_(function() {
                var and__3546__auto____26597 = x__451__auto____26596;
                if(cljs.core.truth_(and__3546__auto____26597)) {
                  var and__3546__auto____26598 = x__451__auto____26596.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3546__auto____26598)) {
                    return cljs.core.not.call(null, x__451__auto____26596.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3546__auto____26598
                  }
                }else {
                  return and__3546__auto____26597
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__451__auto____26596)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____26599)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____26599
            }
          }else {
            return and__3546__auto____26595
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__451__auto____26600 = obj;
          if(cljs.core.truth_(function() {
            var and__3546__auto____26601 = x__451__auto____26600;
            if(cljs.core.truth_(and__3546__auto____26601)) {
              var and__3546__auto____26602 = x__451__auto____26600.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3546__auto____26602)) {
                return cljs.core.not.call(null, x__451__auto____26600.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3546__auto____26602
              }
            }else {
              return and__3546__auto____26601
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__451__auto____26600)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__26603 = cljs.core.first.call(null, objs);
  var sb__26604 = new goog.string.StringBuffer;
  var G__26605__26606 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__26605__26606)) {
    var obj__26607 = cljs.core.first.call(null, G__26605__26606);
    var G__26605__26608 = G__26605__26606;
    while(true) {
      if(cljs.core.truth_(obj__26607 === first_obj__26603)) {
      }else {
        sb__26604.append(" ")
      }
      var G__26609__26610 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__26607, opts));
      if(cljs.core.truth_(G__26609__26610)) {
        var string__26611 = cljs.core.first.call(null, G__26609__26610);
        var G__26609__26612 = G__26609__26610;
        while(true) {
          sb__26604.append(string__26611);
          var temp__3698__auto____26613 = cljs.core.next.call(null, G__26609__26612);
          if(cljs.core.truth_(temp__3698__auto____26613)) {
            var G__26609__26614 = temp__3698__auto____26613;
            var G__26617 = cljs.core.first.call(null, G__26609__26614);
            var G__26618 = G__26609__26614;
            string__26611 = G__26617;
            G__26609__26612 = G__26618;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____26615 = cljs.core.next.call(null, G__26605__26608);
      if(cljs.core.truth_(temp__3698__auto____26615)) {
        var G__26605__26616 = temp__3698__auto____26615;
        var G__26619 = cljs.core.first.call(null, G__26605__26616);
        var G__26620 = G__26605__26616;
        obj__26607 = G__26619;
        G__26605__26608 = G__26620;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__26604
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return cljs.core.str.call(null, cljs.core.pr_sb.call(null, objs, opts))
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__26621 = cljs.core.pr_sb.call(null, objs, opts);
  sb__26621.append("\n");
  return cljs.core.str.call(null, sb__26621)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__26622 = cljs.core.first.call(null, objs);
  var G__26623__26624 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__26623__26624)) {
    var obj__26625 = cljs.core.first.call(null, G__26623__26624);
    var G__26623__26626 = G__26623__26624;
    while(true) {
      if(cljs.core.truth_(obj__26625 === first_obj__26622)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__26627__26628 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__26625, opts));
      if(cljs.core.truth_(G__26627__26628)) {
        var string__26629 = cljs.core.first.call(null, G__26627__26628);
        var G__26627__26630 = G__26627__26628;
        while(true) {
          cljs.core.string_print.call(null, string__26629);
          var temp__3698__auto____26631 = cljs.core.next.call(null, G__26627__26630);
          if(cljs.core.truth_(temp__3698__auto____26631)) {
            var G__26627__26632 = temp__3698__auto____26631;
            var G__26635 = cljs.core.first.call(null, G__26627__26632);
            var G__26636 = G__26627__26632;
            string__26629 = G__26635;
            G__26627__26630 = G__26636;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____26633 = cljs.core.next.call(null, G__26623__26626);
      if(cljs.core.truth_(temp__3698__auto____26633)) {
        var G__26623__26634 = temp__3698__auto____26633;
        var G__26637 = cljs.core.first.call(null, G__26623__26634);
        var G__26638 = G__26623__26634;
        obj__26625 = G__26637;
        G__26623__26626 = G__26638;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__26639) {
    var objs = cljs.core.seq(arglist__26639);
    return pr_str__delegate.call(this, objs)
  };
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__26640) {
    var objs = cljs.core.seq(arglist__26640);
    return prn_str__delegate.call(this, objs)
  };
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__26641) {
    var objs = cljs.core.seq(arglist__26641);
    return pr__delegate.call(this, objs)
  };
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__26642) {
    var objs = cljs.core.seq(arglist__26642);
    return cljs_core_print__delegate.call(this, objs)
  };
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__26643) {
    var objs = cljs.core.seq(arglist__26643);
    return print_str__delegate.call(this, objs)
  };
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__26644) {
    var objs = cljs.core.seq(arglist__26644);
    return println__delegate.call(this, objs)
  };
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__26645) {
    var objs = cljs.core.seq(arglist__26645);
    return println_str__delegate.call(this, objs)
  };
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__26646) {
    var objs = cljs.core.seq(arglist__26646);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__26647 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__26647, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, n))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, bool))
};
cljs.core.Set.prototype.cljs$core$IPrintable$ = true;
cljs.core.Set.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, obj))) {
    return cljs.core.list.call(null, cljs.core.str.call(null, ":", function() {
      var temp__3698__auto____26648 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____26648)) {
        var nspc__26649 = temp__3698__auto____26648;
        return cljs.core.str.call(null, nspc__26649, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3698__auto____26650 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____26650)) {
          var nspc__26651 = temp__3698__auto____26650;
          return cljs.core.str.call(null, nspc__26651, "/")
        }else {
          return null
        }
      }(), cljs.core.name.call(null, obj)))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", cljs.core.str.call(null, this$), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__26652 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__26652, "{", ", ", "}", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches
};
cljs.core.Atom.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__26653 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__26654 = this;
  var G__26655__26656 = cljs.core.seq.call(null, this__26654.watches);
  if(cljs.core.truth_(G__26655__26656)) {
    var G__26658__26660 = cljs.core.first.call(null, G__26655__26656);
    var vec__26659__26661 = G__26658__26660;
    var key__26662 = cljs.core.nth.call(null, vec__26659__26661, 0, null);
    var f__26663 = cljs.core.nth.call(null, vec__26659__26661, 1, null);
    var G__26655__26664 = G__26655__26656;
    var G__26658__26665 = G__26658__26660;
    var G__26655__26666 = G__26655__26664;
    while(true) {
      var vec__26667__26668 = G__26658__26665;
      var key__26669 = cljs.core.nth.call(null, vec__26667__26668, 0, null);
      var f__26670 = cljs.core.nth.call(null, vec__26667__26668, 1, null);
      var G__26655__26671 = G__26655__26666;
      f__26670.call(null, key__26669, this$, oldval, newval);
      var temp__3698__auto____26672 = cljs.core.next.call(null, G__26655__26671);
      if(cljs.core.truth_(temp__3698__auto____26672)) {
        var G__26655__26673 = temp__3698__auto____26672;
        var G__26680 = cljs.core.first.call(null, G__26655__26673);
        var G__26681 = G__26655__26673;
        G__26658__26665 = G__26680;
        G__26655__26666 = G__26681;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch = function(this$, key, f) {
  var this__26674 = this;
  return this$.watches = cljs.core.assoc.call(null, this__26674.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__26675 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__26675.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__26676 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__26676.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__26677 = this;
  return this__26677.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__26678 = this;
  return this__26678.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__26679 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__26688 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__26689 = function() {
    var G__26691__delegate = function(x, p__26682) {
      var map__26683__26684 = p__26682;
      var map__26683__26685 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__26683__26684)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__26683__26684) : map__26683__26684;
      var validator__26686 = cljs.core.get.call(null, map__26683__26685, "\ufdd0'validator");
      var meta__26687 = cljs.core.get.call(null, map__26683__26685, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__26687, validator__26686, null)
    };
    var G__26691 = function(x, var_args) {
      var p__26682 = null;
      if(goog.isDef(var_args)) {
        p__26682 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__26691__delegate.call(this, x, p__26682)
    };
    G__26691.cljs$lang$maxFixedArity = 1;
    G__26691.cljs$lang$applyTo = function(arglist__26692) {
      var x = cljs.core.first(arglist__26692);
      var p__26682 = cljs.core.rest(arglist__26692);
      return G__26691__delegate.call(this, x, p__26682)
    };
    return G__26691
  }();
  atom = function(x, var_args) {
    var p__26682 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__26688.call(this, x);
      default:
        return atom__26689.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__26689.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____26693 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____26693)) {
    var validate__26694 = temp__3698__auto____26693;
    if(cljs.core.truth_(validate__26694.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3282)))));
    }
  }else {
  }
  var old_value__26695 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__26695, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___26696 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___26697 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___26698 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___26699 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___26700 = function() {
    var G__26702__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__26702 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__26702__delegate.call(this, a, f, x, y, z, more)
    };
    G__26702.cljs$lang$maxFixedArity = 5;
    G__26702.cljs$lang$applyTo = function(arglist__26703) {
      var a = cljs.core.first(arglist__26703);
      var f = cljs.core.first(cljs.core.next(arglist__26703));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__26703)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__26703))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__26703)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__26703)))));
      return G__26702__delegate.call(this, a, f, x, y, z, more)
    };
    return G__26702
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___26696.call(this, a, f);
      case 3:
        return swap_BANG___26697.call(this, a, f, x);
      case 4:
        return swap_BANG___26698.call(this, a, f, x, y);
      case 5:
        return swap_BANG___26699.call(this, a, f, x, y, z);
      default:
        return swap_BANG___26700.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___26700.cljs$lang$applyTo;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, a.state, oldval))) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__26704) {
    var iref = cljs.core.first(arglist__26704);
    var f = cljs.core.first(cljs.core.next(arglist__26704));
    var args = cljs.core.rest(cljs.core.next(arglist__26704));
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__26705 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__26706 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.gensym_counter === null)) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__26705.call(this);
      case 1:
        return gensym__26706.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f
};
cljs.core.Delay.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_ = function(d) {
  var this__26708 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__26708.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__26709 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__26709.state, function(p__26710) {
    var curr_state__26711 = p__26710;
    var curr_state__26712 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, curr_state__26711)) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__26711) : curr_state__26711;
    var done__26713 = cljs.core.get.call(null, curr_state__26712, "\ufdd0'done");
    if(cljs.core.truth_(done__26713)) {
      return curr_state__26712
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__26709.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.truth_(cljs.core.delay_QMARK_.call(null, x))) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__26714__26715 = options;
    var map__26714__26716 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__26714__26715)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__26714__26715) : map__26714__26715;
    var keywordize_keys__26717 = cljs.core.get.call(null, map__26714__26716, "\ufdd0'keywordize-keys");
    var keyfn__26718 = cljs.core.truth_(keywordize_keys__26717) ? cljs.core.keyword : cljs.core.str;
    var f__26724 = function thisfn(x) {
      if(cljs.core.truth_(cljs.core.seq_QMARK_.call(null, x))) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.truth_(cljs.core.coll_QMARK_.call(null, x))) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.truth_(goog.isObject.call(null, x))) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__520__auto____26723 = function iter__26719(s__26720) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__26720__26721 = s__26720;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__26720__26721))) {
                        var k__26722 = cljs.core.first.call(null, s__26720__26721);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__26718.call(null, k__26722), thisfn.call(null, x[k__26722])]), iter__26719.call(null, cljs.core.rest.call(null, s__26720__26721)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__520__auto____26723.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if(cljs.core.truth_("\ufdd0'else")) {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__26724.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__26725) {
    var x = cljs.core.first(arglist__26725);
    var options = cljs.core.rest(arglist__26725);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__26726 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__26730__delegate = function(args) {
      var temp__3695__auto____26727 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__26726), args);
      if(cljs.core.truth_(temp__3695__auto____26727)) {
        var v__26728 = temp__3695__auto____26727;
        return v__26728
      }else {
        var ret__26729 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__26726, cljs.core.assoc, args, ret__26729);
        return ret__26729
      }
    };
    var G__26730 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__26730__delegate.call(this, args)
    };
    G__26730.cljs$lang$maxFixedArity = 0;
    G__26730.cljs$lang$applyTo = function(arglist__26731) {
      var args = cljs.core.seq(arglist__26731);
      return G__26730__delegate.call(this, args)
    };
    return G__26730
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__26733 = function(f) {
    while(true) {
      var ret__26732 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__26732))) {
        var G__26736 = ret__26732;
        f = G__26736;
        continue
      }else {
        return ret__26732
      }
      break
    }
  };
  var trampoline__26734 = function() {
    var G__26737__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__26737 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__26737__delegate.call(this, f, args)
    };
    G__26737.cljs$lang$maxFixedArity = 1;
    G__26737.cljs$lang$applyTo = function(arglist__26738) {
      var f = cljs.core.first(arglist__26738);
      var args = cljs.core.rest(arglist__26738);
      return G__26737__delegate.call(this, f, args)
    };
    return G__26737
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__26733.call(this, f);
      default:
        return trampoline__26734.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__26734.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__26739 = function() {
    return rand.call(null, 1)
  };
  var rand__26740 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__26739.call(this);
      case 1:
        return rand__26740.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__26742 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__26742, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__26742, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___26751 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___26752 = function(h, child, parent) {
    var or__3548__auto____26743 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3548__auto____26743)) {
      return or__3548__auto____26743
    }else {
      var or__3548__auto____26744 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3548__auto____26744)) {
        return or__3548__auto____26744
      }else {
        var and__3546__auto____26745 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3546__auto____26745)) {
          var and__3546__auto____26746 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3546__auto____26746)) {
            var and__3546__auto____26747 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3546__auto____26747)) {
              var ret__26748 = true;
              var i__26749 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3548__auto____26750 = cljs.core.not.call(null, ret__26748);
                  if(cljs.core.truth_(or__3548__auto____26750)) {
                    return or__3548__auto____26750
                  }else {
                    return cljs.core._EQ_.call(null, i__26749, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__26748
                }else {
                  var G__26754 = isa_QMARK_.call(null, h, child.call(null, i__26749), parent.call(null, i__26749));
                  var G__26755 = i__26749 + 1;
                  ret__26748 = G__26754;
                  i__26749 = G__26755;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____26747
            }
          }else {
            return and__3546__auto____26746
          }
        }else {
          return and__3546__auto____26745
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___26751.call(this, h, child);
      case 3:
        return isa_QMARK___26752.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__26756 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__26757 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__26756.call(this, h);
      case 2:
        return parents__26757.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__26759 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__26760 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__26759.call(this, h);
      case 2:
        return ancestors__26760.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__26762 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__26763 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__26762.call(this, h);
      case 2:
        return descendants__26763.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__26773 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3566)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__26774 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3570)))));
    }
    var tp__26768 = "\ufdd0'parents".call(null, h);
    var td__26769 = "\ufdd0'descendants".call(null, h);
    var ta__26770 = "\ufdd0'ancestors".call(null, h);
    var tf__26771 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____26772 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__26768.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__26770.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__26770.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__26768, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__26771.call(null, "\ufdd0'ancestors".call(null, h), tag, td__26769, parent, ta__26770), "\ufdd0'descendants":tf__26771.call(null, "\ufdd0'descendants".call(null, h), parent, ta__26770, tag, td__26769)})
    }();
    if(cljs.core.truth_(or__3548__auto____26772)) {
      return or__3548__auto____26772
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__26773.call(this, h, tag);
      case 3:
        return derive__26774.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__26780 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__26781 = function(h, tag, parent) {
    var parentMap__26776 = "\ufdd0'parents".call(null, h);
    var childsParents__26777 = cljs.core.truth_(parentMap__26776.call(null, tag)) ? cljs.core.disj.call(null, parentMap__26776.call(null, tag), parent) : cljs.core.set([]);
    var newParents__26778 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__26777)) ? cljs.core.assoc.call(null, parentMap__26776, tag, childsParents__26777) : cljs.core.dissoc.call(null, parentMap__26776, tag);
    var deriv_seq__26779 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__26765_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__26765_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__26765_SHARP_), cljs.core.second.call(null, p1__26765_SHARP_)))
    }, cljs.core.seq.call(null, newParents__26778)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__26776.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__26766_SHARP_, p2__26767_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__26766_SHARP_, p2__26767_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__26779))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__26780.call(this, h, tag);
      case 3:
        return underive__26781.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__26783 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____26785 = cljs.core.truth_(function() {
    var and__3546__auto____26784 = xprefs__26783;
    if(cljs.core.truth_(and__3546__auto____26784)) {
      return xprefs__26783.call(null, y)
    }else {
      return and__3546__auto____26784
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____26785)) {
    return or__3548__auto____26785
  }else {
    var or__3548__auto____26787 = function() {
      var ps__26786 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__26786) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__26786), prefer_table))) {
          }else {
          }
          var G__26790 = cljs.core.rest.call(null, ps__26786);
          ps__26786 = G__26790;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____26787)) {
      return or__3548__auto____26787
    }else {
      var or__3548__auto____26789 = function() {
        var ps__26788 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__26788) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__26788), y, prefer_table))) {
            }else {
            }
            var G__26791 = cljs.core.rest.call(null, ps__26788);
            ps__26788 = G__26791;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____26789)) {
        return or__3548__auto____26789
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____26792 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____26792)) {
    return or__3548__auto____26792
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__26801 = cljs.core.reduce.call(null, function(be, p__26793) {
    var vec__26794__26795 = p__26793;
    var k__26796 = cljs.core.nth.call(null, vec__26794__26795, 0, null);
    var ___26797 = cljs.core.nth.call(null, vec__26794__26795, 1, null);
    var e__26798 = vec__26794__26795;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__26796))) {
      var be2__26800 = cljs.core.truth_(function() {
        var or__3548__auto____26799 = be === null;
        if(cljs.core.truth_(or__3548__auto____26799)) {
          return or__3548__auto____26799
        }else {
          return cljs.core.dominates.call(null, k__26796, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__26798 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__26800), k__26796, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__26796, " and ", cljs.core.first.call(null, be2__26800), ", and neither is preferred"));
      }
      return be2__26800
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__26801)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__26801));
      return cljs.core.second.call(null, best_entry__26801)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____26802 = mf;
    if(cljs.core.truth_(and__3546__auto____26802)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3546__auto____26802
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3548__auto____26803 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____26803)) {
        return or__3548__auto____26803
      }else {
        var or__3548__auto____26804 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3548__auto____26804)) {
          return or__3548__auto____26804
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____26805 = mf;
    if(cljs.core.truth_(and__3546__auto____26805)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3546__auto____26805
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____26806 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____26806)) {
        return or__3548__auto____26806
      }else {
        var or__3548__auto____26807 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3548__auto____26807)) {
          return or__3548__auto____26807
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____26808 = mf;
    if(cljs.core.truth_(and__3546__auto____26808)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3546__auto____26808
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____26809 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____26809)) {
        return or__3548__auto____26809
      }else {
        var or__3548__auto____26810 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3548__auto____26810)) {
          return or__3548__auto____26810
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____26811 = mf;
    if(cljs.core.truth_(and__3546__auto____26811)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3546__auto____26811
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____26812 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____26812)) {
        return or__3548__auto____26812
      }else {
        var or__3548__auto____26813 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3548__auto____26813)) {
          return or__3548__auto____26813
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____26814 = mf;
    if(cljs.core.truth_(and__3546__auto____26814)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3546__auto____26814
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____26815 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____26815)) {
        return or__3548__auto____26815
      }else {
        var or__3548__auto____26816 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3548__auto____26816)) {
          return or__3548__auto____26816
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____26817 = mf;
    if(cljs.core.truth_(and__3546__auto____26817)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3546__auto____26817
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3548__auto____26818 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____26818)) {
        return or__3548__auto____26818
      }else {
        var or__3548__auto____26819 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3548__auto____26819)) {
          return or__3548__auto____26819
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____26820 = mf;
    if(cljs.core.truth_(and__3546__auto____26820)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3546__auto____26820
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3548__auto____26821 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____26821)) {
        return or__3548__auto____26821
      }else {
        var or__3548__auto____26822 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3548__auto____26822)) {
          return or__3548__auto____26822
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____26823 = mf;
    if(cljs.core.truth_(and__3546__auto____26823)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3546__auto____26823
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3548__auto____26824 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____26824)) {
        return or__3548__auto____26824
      }else {
        var or__3548__auto____26825 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3548__auto____26825)) {
          return or__3548__auto____26825
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__26826 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__26827 = cljs.core._get_method.call(null, mf, dispatch_val__26826);
  if(cljs.core.truth_(target_fn__26827)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__26826));
  }
  return cljs.core.apply.call(null, target_fn__26827, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy
};
cljs.core.MultiFn.cljs$core$IPrintable$_pr_seq = function(this__367__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__26828 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__26829 = this;
  cljs.core.swap_BANG_.call(null, this__26829.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__26829.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__26829.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__26829.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__26830 = this;
  cljs.core.swap_BANG_.call(null, this__26830.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__26830.method_cache, this__26830.method_table, this__26830.cached_hierarchy, this__26830.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__26831 = this;
  cljs.core.swap_BANG_.call(null, this__26831.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__26831.method_cache, this__26831.method_table, this__26831.cached_hierarchy, this__26831.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__26832 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__26832.cached_hierarchy), cljs.core.deref.call(null, this__26832.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__26832.method_cache, this__26832.method_table, this__26832.cached_hierarchy, this__26832.hierarchy)
  }
  var temp__3695__auto____26833 = cljs.core.deref.call(null, this__26832.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____26833)) {
    var target_fn__26834 = temp__3695__auto____26833;
    return target_fn__26834
  }else {
    var temp__3695__auto____26835 = cljs.core.find_and_cache_best_method.call(null, this__26832.name, dispatch_val, this__26832.hierarchy, this__26832.method_table, this__26832.prefer_table, this__26832.method_cache, this__26832.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____26835)) {
      var target_fn__26836 = temp__3695__auto____26835;
      return target_fn__26836
    }else {
      return cljs.core.deref.call(null, this__26832.method_table).call(null, this__26832.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__26837 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__26837.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__26837.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__26837.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__26837.method_cache, this__26837.method_table, this__26837.cached_hierarchy, this__26837.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__26838 = this;
  return cljs.core.deref.call(null, this__26838.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__26839 = this;
  return cljs.core.deref.call(null, this__26839.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__26840 = this;
  return cljs.core.do_dispatch.call(null, mf, this__26840.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__26841__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__26841 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__26841__delegate.call(this, _, args)
  };
  G__26841.cljs$lang$maxFixedArity = 1;
  G__26841.cljs$lang$applyTo = function(arglist__26842) {
    var _ = cljs.core.first(arglist__26842);
    var args = cljs.core.rest(arglist__26842);
    return G__26841__delegate.call(this, _, args)
  };
  return G__26841
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("pull_panel.main");
goog.require("cljs.core");
pull_panel.main.jquery = $;
pull_panel.main.jquery.call(null, function() {
  return pull_panel.main.jquery.call(null, "div.meat").html("This is a test!!!!").append("<div>Look here!</div>")
});
