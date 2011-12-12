
(function(undefined) {
  
  var Sysmo = {
    stub: function(){},
    makeArray: function(args) {
      return Array.prototype.slice.call(args);
    },
    extend: function(target, values, deep) {
      !target && (target = {});
      
      for (var property in values) {
        
        var value = values[property];
        
        if (!(property in target)) {
          
          target[property] = !deep ? value : 
                             (value == null || isObject(value)) ? extend({}, value) : 
                             (isArray(value)) ? value.slice(0) : value;
                             
        // compares objects that already exist in target if "deep" is true
        // copies properties or object if the target is NULL or an object
        } else if (deep && isObject(value) && 
                  //(!(property in target) || isObject(target[property]))) {
                  (target[property] == null || isObject(target[property]))) {
          //don't need to set property because the object is updated by reference
          /*target[property] = */Sysmo.extend(target[property] || {}, value, deep);
        }
      }
      return target;
    },
    //include an object graph in another
    include: function(target, namespace, graph) {
      
      //if the first param is a string, 
      //we are including the namespace on Sysmo
      if (typeof target == 'string') {
        graph = namespace;
        namespace = target;
        target = Sysmo;
      }
      
      //create namespace on target
      Sysmo.namespace(namespace, target);
      //get inner most object in namespace
      target = Sysmo.getDeepValue(target, namespace);
      //merge graph on inner most object in namespace
      return Sysmo.extend(target, graph);
      
    },
    //build an object graph from a namespace.
    //adds properties to the target object or 
    //returns a new object graph.
    namespace: function(namespace, target) {
      
      target = target || {};
      
      var names = namespace.split('.'),
          context = target;
      
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        context = (name in context) ? context[name] : (context[name] = {});
      }
      
      return target;
    },
    //get the value of a property deeply nested in an object hierarchy
    getDeepValue: function (target, path, default_value) {
      var properties = path.split('.'),
          property;
      
      while (target != null && properties.length) {
        target = target[properties.shift()];
      }
      
      return (target === undefined) ? default_value : target;
    },
    //format a string using indexes, e.g. formatString("first name: {0}, last name: {1}", "Albert", "Einstein")
    formatString: function(template, args) {
      args = (args.constructor !== Array) ? Sysmo.makeArray(arguments).splice(1) : args;
      
      return template.replace(/\{(\d+)\}/g, function(match, capture) { 
        return args[capture];
      });
    },
    //Allows you to chain multiple callbacks together. 
    //The first parameter for each callback is the "next" function 
    //that allows you to pass arguments to the next function.
    //Pass each function that should be a part of the chain 
    //as a parameter to chain() function.
    //NOTE* You can pass an object as the first parameter before a callback 
    //      to use as "this" context when the callback is called
    steps: function(self) {
      var steps = Sysmo.makeArray(arguments),
          next = function() {
            var args = Sysmo.makeArray(arguments),
                step = steps.shift();
      
            args.unshift(next);
            step.apply(self, args);
          };
      
      //an argument that is not a function is assumed to be the "this" context
      if (!/^function/i.test(self)) {
        steps.shift();
      } else {
        self = this;//next;
      }
      
      steps.length && next();
    },
    /*
     ****** Overview ******
     * 
     * Strongly type a function's arguments to allow for any arguments to be optional.
     * 
     * Other resources:
     * http://ejohn.org/blog/javascript-method-overloading/
     * 
     ****** Example implementation ******
     * 
     * //all args are optional... will display overlay with default settings
     * var displayOverlay = function() {
     *   return Sysmo.optionalArgs(arguments, 
     *            String, [Number, false, 0], Function, 
     *            function(message, timeout, callback) {
     *              var overlay = new Overlay(message);
     *              overlay.timeout = timeout;
     *              overlay.display({onDisplayed: callback});
     *            });
     * }
     * 
     ****** Example function call ******
     * 
     * //the window.alert() function is the callback, message and timeout are not defined.
     * displayOverlay(alert);
     * 
     * //displays the overlay after 500 miliseconds, then alerts... message is not defined.
     * displayOverlay(500, alert);
     * 
     ****** Setup ******
     * 
     * arguments = the original arguments to the function defined in your javascript API.
     * config = describe the argument type
     *  - Class - specify the type (e.g. String, Number, Function, Array) 
     *  - [Class/function, boolean, default] - pass an array where the first value is a class or a function...
     *                                         The "boolean" indicates if the first value should be treated as a function.
     *                                         The "default" is an optional default value to use instead of undefined.
     * 
     */
    arrangeArgs: function (/* arguments, config1 [, config2] , callback */) {
      //config format: [String, false, ''], [Number, false, 0], [Function, false, function(){}]
      //config doesn't need a default value.
      //config can also be classes instead of an array if not required and no default value.
      
      var configs = Sysmo.makeArray(arguments),
          //original arguments that we need to verify
          values = Sysmo.makeArray(configs.shift()),
          //the function that will receive the verified arguments
          callback = configs.pop(),
          //the verified argumetns to pass to the callback
          args = [],
          //send the verified arguments to the callback
          done = function() {
            //add the proper number of arguments before adding remaining values
            if (!args.length) {
              args = Array(configs.length);
            }
            //fire callback with args and remaining values concatenated
            return callback.apply(null, args.concat(values));
          };
          
      //if there are not values to process, just fire callback
      if (!values.length) {
        return done();
      }
      
      //loop through configs to create more easily readable objects
      for (var i = 0; i < configs.length; i++) {
        
        var config = configs[i];

        //make sure there's a value
        if (values.length) {
          
          //type or validator function
          var fn = config[0] || config,
              //if config[1] is true, use fn as validator, 
              //otherwise create a validator from a closure to preserve fn for later use
              validate = (config[1]) ? fn : function(value) {
                return value.constructor === fn;
              };
          
          //see if arg value matches config
          if (validate(values[0])) {
            args.push(values.shift());
            continue;
          }
        }
        
        //add a default value if there is no value in the original args
        //or if the type didn't match
        args.push(config[2]);
      }
      
      return done();
    }

  };
  
  if (typeof module !== "undefined" && module !== null) {
    module.exports = Sysmo;
  } else {
    window.Sysmo = Sysmo;
  }
  
})();
