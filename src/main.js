( function () {
	if( !window.Natives ) {
		console.error( 'This plugin depends on hooking-api, please include it.' );
		return;
	} else if( 
		!window.VendorPrefixes || 
		!window.Natives || 
		!Object.defineProperty || 
		!Object.create || 
		!Natives.translate( 'TransitionEvent', { prefixType: 'JSClass' } ) || 
		!Natives.translate( 'MutationObserver', { prefixType: 'JSClass' } ) 
	) {
		console.error( 'This browser cannot support transitionstart event.' );
		return;
	}

	//	Preventing double installation.
	if( window.transitionStartInstalled ) 
		return;
	Object.defineProperty( window, 'transitionStartInstalled', { value: true } );

	//	Fixing IE11 mutation observer bug.
	//	See at: https://gist.github.com/t10ko/4aceb8c71681fdb275e33efe5e576b14
	( function () {
		var example = document.createElement( '_' ),
		    observer = new MutationObserver( function () {} );
		observer.observe( example, { attributes: true } );

		//	Randomly changing style attribute using setProperty method.
		example.style.setProperty( 'display', 'block' );

		//	If no mutation record generated, than it's IE11 and it's a bug :)
		if( !observer.takeRecords().length ) {
			Natives.hook( 'CSSStyleDeclaration.prototype.setProperty', function ( original ) {
				return function ( name, to_value ) {
					var value = this.getPropertyValue( name ),
						priority = this.getPropertyPriority( name ),
						result = original.apply( this, arguments );

					//	HACK!
					//	If something modified after setProperty call, generate mutation by appending white space to cssText.
					if( value != this.getPropertyValue( name ) || priority != this.getPropertyPriority( name ) ) 
						this.cssText += ' ';
					return result;
				}
			} );
		}
	} ) ();

	//	This list is for handling transition: all
	//	Got from here https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animated_properties
	//	Sorry for this part of the code, but there is no other way :)
	//	If you can suggest something else to handle 'transition: all' situations, please do.
	var NativeSupport = false, 
		Body = null, 
		CSSAnimatedProperties = {
			'-moz-outline-radius': 0, '-moz-outline-radius-bottomleft': 0, '-moz-outline-radius-bottomright': 0, '-moz-outline-radius-topleft': 0, '-moz-outline-radius-topright': 0, '-webkit-text-fill-color': 0, '-webkit-text-stroke': 0, '-webkit-text-stroke-color': 0, '-webkit-touch-callout': 0, 'backdrop-filter': 0, 'background': 0, 'background-color': 0, 'background-position': 0, 'background-size': 0, 'border': 0, 'border-bottom': 0, 'border-bottom-color': 0, 'border-bottom-left-radius': 0, 'border-bottom-right-radius': 0, 'border-bottom-width': 0, 'border-color': 0, 'border-left': 0, 'border-left-color': 0, 'border-left-width': 0, 'border-radius': 0, 'border-right': 0, 'border-right-color': 0, 'border-right-width': 0, 'border-top': 0, 'border-top-color': 0, 'border-top-left-radius': 0, 'border-top-right-radius': 0, 'border-top-width': 0, 'border-width': 0, 'bottom': 0, 'box-shadow': 0, 'clip': 0, 'clip-path': 0, 'color': 0, 'column-count': 0, 'column-gap': 0, 'column-rule': 0, 'column-rule-color': 0, 'column-rule-width': 0, 'column-width': 0, 'columns': 0, 'filter': 0, 'flex': 0, 'flex-basis': 0, 'flex-grow': 0, 'flex-shrink': 0, 'font': 0, 'font-size': 0, 'font-size-adjust': 0, 'font-stretch': 0, 'font-weight': 0, 'grid-column-gap': 0, 'grid-gap': 0, 'grid-row-gap': 0, 'height': 0, 'left': 0, 'letter-spacing': 0, 'line-height': 0, 'margin': 0, 'margin-bottom': 0, 'margin-left': 0, 'margin-right': 0, 'margin-top': 0, 'mask': 0, 'mask-position': 0, 'mask-size': 0, 'max-height': 0, 'max-width': 0, 'min-height': 0, 'min-width': 0, 'motion-offset': 0, 'motion-rotation': 0, 'object-position': 0, 'opacity': 0, 'order': 0, 'outline': 0, 'outline-color': 0, 'outline-offset': 0, 'outline-width': 0, 'padding': 0, 'padding-bottom': 0, 'padding-left': 0, 'padding-right': 0, 'padding-top': 0, 'perspective': 0, 'perspective-origin': 0, 'right': 0, 'scroll-snap-coordinate': 0, 'scroll-snap-destination': 0, 'shape-image-threshold': 0, 'shape-margin': 0, 'shape-outside': 0, 'text-decoration': 0, 'text-decoration-color': 0, 'text-emphasis': 0, 'text-emphasis-color': 0, 'text-indent': 0, 'text-shadow': 0, 'top': 0, 'transform': 0, 'transform-origin': 0, 'vertical-align': 0, 'visibility': 0, 'width': 0, 'word-spacing': 0, 'z-index': 0
		};

	var ArrayProto = Array.prototype, 
		ArrayPush = ArrayProto.push;
	var GetType, IsInstanceOf;
	( function () {
		var class2type = {}, 
			ToString = {}.toString;

		[ 'Boolean', 'Number', 'String', 'Function', 'Array', 'Date', 'RegExp', 'Object', 'Error', 'Symbol' ].forEach( function ( name ) {
			class2type[ '[object ' + name + ']' ] = name.toLowerCase();
		} );
		GetType = ( function () {
			return function GetType( obj ) {
				return obj == null ? obj + '' : (
					typeof obj === 'object' || typeof obj === 'function' ?
					class2type[ ToString.call( obj ) ] || 'object' :
					typeof obj
				);
			};
		} ) ();
		IsInstanceOf = ( function () {
			return function IsInstanceOf( obj, classname ) { return obj != null && ToString.call( obj ).slice( 8, -1 ) == classname; };
		} ) ();
	} ) ();
	function IsWindow( target ) { return target != null && target === target.window; };
	function IsDocument( target ) { return target != null && IsInstanceOf( target, 'HTMLDocument' ); };
	var IsElement = ( function () {
		var self = IsElement;
		self.WINDOW = 1;
		self.DOCUMENT = 2;
		self.ELEMENT = 3;
		self.only = function ( target ) { return IsElement( target, true ); };
		function IsElement( target, only_element ) {
			if( target ) {
				if( target instanceof Element )
					return self.ELEMENT;
				if( !only_element ) {
					if( IsWindow( target ) )
						return self.WINDOW;
					if( IsDocument( target ) )
						return self.DOCUMENT;
				}
			}
			return false;
		};
		return self;
	} ) ();
	var IsArray = Array.isArray;
	var IsFunction = ( function () {
		var func_proto = Function.prototype;
		return function IsFunction( target ) { return typeof target === 'function' && target != func_proto; };
	} ) ();
	function IsString( target ) { return target != null && ( GetType( target ) === 'string' ); };
	function IsObject( value ) { return value != null && ( typeof value === 'function' || typeof value === 'object' ); };
	function IsArrayLike( obj ) {
		if( !IsObject( obj ) || IsFunction( obj ) || IsWindow( obj ) )
			return false;
		var length = !!obj && ('length' in obj) && obj.length;
		return IsArray( obj ) || length === 0 || IsNumber( length ) && length > 0 && ( length - 1 ) in obj;
	};
	function ToString( value ) { return value + ""; };
	function Slice( target, begin, end ) {
		var i, result = [], size, len = target.length;
		begin = ((begin = begin || 0) >= 0) ? begin : Math.max(0, len + begin);
		if((end = isNaN(end) ? len : Math.min(end, len)) < 0) end = len + end;
		if((size = end - begin) > 0) {
			result = new Array(size);
			for (i = 0; i < size; i++) result[i] = target[begin + i];
		}
		return result;
	};
	function ObjectFillKeys( keys, value, target ) {
		var result = target || {}, i = 0, is_func = IsFunction( value );
		for( ; i < keys.length; i++ ) {
			var key = keys[ i ];
			result[ key ] = is_func ? value( key, i ) : value;
		}
		return result;
	};
	function IsObjectEmpty ( arg ) {
		for( var i in arg ) return false;
		return true;
	};
	function RemoveFrom ( container, index ) {
		var result = container[ index ];
		container.splice( index, 1 );
		return result;
	};
	function InsertAt ( container, elements, index ) {
		if( !IsArrayLike( elements ) ) 
			elements = [ elements ];
		if( index === undefined ) {
			ArrayPush.apply( container, elements );
		} else {
			var args = [ index, 0 ];
			ArrayPush.apply( args, elements );
			ArrayProto.splice.apply( container, args );
		}
		return container;
	};
	function GetLast( list ) { return list[ list.length - 1 ]; };
	function SetLast( list, value ) { return ( list[ list.length - 1 ] = value, list ); };
	function RandomString( len ) {
		len = len || 8;
		var id = '';
		while( (id += Math.random().toString(16).slice(2), id.length < len) );
		return id.slice(0, len);
	};
	var HasOwn = ( function () {
		var has_own = {}.hasOwnProperty;
		return function HasOwn( target, name ) {
			return !!name && has_own.call( target, name );
		};
	} ) ();
	function ObjectID( target, dont_make ) {
		var key = target.objectUniqueID;
		if( !key && !dont_make ) 
			Object.defineProperty( target, 'objectUniqueID', { value: key = RandomString() } )
		return key;
	};
	function PopProp( target, prop ) {
		var result = target[ prop ];
		delete target[ prop ];
		return result;
	};
	var RoundToFixed = ( function ( default_ ) {
		var cache = _();
		function GetPosition( value ) { return cache[ value ] || ( cache[ value ] = Math.pow( 10, value ) ); };
		return function RoundToFixed( value, to ) {
			var position = GetPosition( to || default_ );
			return Math.round( value * position ) / position;
		};
	} ) ( 10 );
	function _() {
		var result = Object.create( null ), name, i = 0;
		for( ; i < arguments.length; i++ ) {
			var value = arguments[i];
			if( !(i % 2) ) {
				name = value;
			} else {
				result[ name ] = value;
			}
		}
		return result;
	};

	/**
	 * Microtask immediates API based on MutationObservers.
	 */
	var Immediates = ( function () {
		var self = {}, 
			current_id, 
			first = null, 
			stack = {}, 
			target = document.createElement( '_' );

		function UpdateCurrentID() { return current_id = RandomString(); };
		target.setAttribute( 'data-id', UpdateCurrentID() );

		Natives.translate( 'MutationObserver', { prefixType: 'JSClass' } );

		var RemakeObserver = ( function () {
			var current = null, 
				observe_flags = { attributes: true, attributeOldValue: true };
			return function() {
				if( current )
					current.disconnect();
				current = new Natives.$.MutationObserver( function ( mutations ) {
					if( first ) {
						first.handler.apply( null, first.args );
						first = null;
					}
					var i = mutations.length;
					while( i-- ) {
						var id = mutations[ i ].oldValue, 
							info = stack[ id ];
						if( info ) {
							info.handler.apply( null, info.args );
							delete stack[ id ];
						}
					}
				} );
				current.observe( target, observe_flags );
			}
		} ) ();
		RemakeObserver();

		function SetImmediate( handler, args ) {
			var info = Object.create( null );
			info.handler = handler;
			info.args = Slice( args, 1 );
			target.setAttribute( 'data-id', UpdateCurrentID() );
			return info;
		}

		self.set = function ( handler ) {
			var id = current_id;
			stack[ id ] = SetImmediate( handler, arguments );
			return id;
		};
		self.clear = function ( id ) { delete stack[ id ]; };
		return self;
	} ) ();

	/**
	 * CSS styles manipulation API.
	 */
	var GetEvent;
	var CSS = ( function () {
		var self = {};

		//	Case conversion functions.
		var ParamCase = ( function () {
			var regex = /([A-Z]+)/g;
			function Replacer( x, y ) { return '-' + y.toLowerCase(); };
			return function ParamCase( property, important ) {
				return important ? property.replace( regex, Replacer ) : property;
			};
		} ) ();
		var CamelCase = ( function () {
			var regex = /(\-[a-z])/g;
			function Replacer( x ) { return x.slice(1).toUpperCase(); };
			return function CamelCase( property, important ) {
				return important ? property.replace( regex, Replacer ) : property;
			};
		} ) ();

		//	Creating test element
		var Translate = ( function () {
			var prop_translation = {}, 
				self = Translate;
			function Translate( name ) {
				return prop_translation[ name ] || name;
			};
			self.add = function ( name, to_name ) {
				var names = [ CamelCase( name ), ParamCase( name ) ];
					i = names.length;
				while( i-- ) {
					var name = names[ i ];
					if( !HasOwn( prop_translation, name ) )
						prop_translation[ name ] = to_name;
				}
			};
			self.has = function ( name ) { return HasOwn( prop_translation, name ); };
			return self;
		} ) ();

		function DeleteProperty( target, property ) {
			target.style[ property ] = '';
		};
		function SetProperty( target, property, value, important ) {
			if( important ) {
				target.style.setProperty( ParamCase( property ), value, 'important' );
			} else {
				target.style[ property ] = value;
			}
		}

		function IsValueEmpty( value ) { return value == null || value === ''; };
		self.setRaw = function ( target, property, value, important ) {
			if( IsValueEmpty( value ) ) {
				DeleteProperty( target, property );
			} else {
				try { SetProperty( target, property, value, important ); } catch( err ) {};
			}			
		};

		self.getComputed = ( function ( data_key ) {
			return function GetComputedStyles( target ) {
				var value = target[ data_key ];
				if( !value )
					Object.defineProperty( target, data_key, { value: (value = window.getComputedStyle( target )) } );
				return value;
			};
		} ) ( 'computed-styles' );
		( function () {
			var test_elements = {};
			function TrySetValue( check_support, name, value, tagname ) {
				var node = test_elements[ tagname = tagname || '_' ] || ( test_elements[ tagname ] = document.createElement( tagname ) ),
					styles = node.style, 
					name = name = Translate( name ) && HasOwn( styles, name ) && name;

				//	This element is not supporting this property
				if( !name )
					return false;
				if( check_support && arguments.length < 3 )
					return true;

				//	If only property name check wanted
				var last_value = styles[ name ];
				if( arguments.length == 1 || last_value === value )
					return check_support || value;

				//	If there's a need to check for value support
				try { styles[ name ] = value; } catch( e ) {
					return false;
				}

				//	If style value has been changed, than this property is supported
				var new_value = styles[ name ];
				if( new_value == last_value )
					return false;
				if( check_support || new_value == value )
					return check_support || value;

				return new_value;
			};
			self.isSupported = function ( name, value, tagname ) {
				return TrySetValue( true, name, value, tagname );
			};
			self.sanitizeValue = function ( name, value, tagname ) {
				return TrySetValue( false, name, value, tagname );
			};
		} ) ();
		( function () {
			var value_rounders = { opacity: function ( value ) { return RoundToFixed( value, 2 ); } }, 
				convert_to_px = { '_': {} };
			function CheckConversion( tag_name, property, value ) {
				if( !HasOwn( convert_to_px, tag_name ) ) 
					convert_to_px[ tag_name ] = {};
				if( !HasOwn( convert_to_px[ tag_name ], property ) ) {
					if( arguments.length > 2 ) {
						convert_to_px[ tag_name ][ property ] = self.isSupported( property, value + 'px', tag_name );
					} else {
						return false;
					}
				}
				return convert_to_px[ tag_name ][ property ];
			}
			self.fixValue = function ( property, value, node, do_not_check ) {
				if( IsValueEmpty( value ) )
					return value;
				var tag = node && node.tagName || '_';
				if( !isNaN( value ) ) {
					if( HasOwn( value_rounders, property ) )
						return value_rounders[ property ]( value );
					if( CheckConversion( tag, property, value ) ) 
						value = Math.round( value ) + 'px';
				} else if( !do_not_check && !self.isSupported( property, value, tag ) ) {
					value = null;
				}
				return value;
			};
		} ) ();

		//	Style getting and setting functionality
		self.get = function ( target, names, inline ) {
			var is_single = IsString( names );
			if( is_single ) 
				names = [ names ];
			var styles = inline && target.style || self.getComputed( target ), 
				result = {}, 
				i = 0;
			for( ; i < names.length; i++ ) {
				var name = names[ i ];
				result[ name ] = styles[ Translate( name ) ];
			}
			return is_single ? result[ name ] : result;
		};

		function SetOneProperty( target, property, value, important ) {
			var property = Translate( property ), 
				fixed_value = self.fixValue( property, value, target, true );
			if( fixed_value !== null )
				self.setRaw( target, property, fixed_value, important );
		}
		self.has = function ( target, property ) { return HasOwn( target.style, property ); };
		self.set = function ( target, list, important ) {
			for( var property in list ) {
				SetOneProperty( target, ParamCase( property, important ), list[ property ], important );
			}
		};
		self.delete = function ( target, list ) {
			if( !IsArray( list ) ) 
				list = [ list ];
			var i = list.length;
			while( i-- ) 
				DeleteProperty( target, Translate( list[ i ] ) );
		};
		( function ( list ) {
			function GetFirst( target ) {
				for( var name in target )
					return target[ name ];
			}
			for( var key in list ) {
				var properties = list[ key ], 
					tester = GetFirst( properties );
				if( self.isSupported( tester ) )
					continue;

				var converted = VendorPrefixes.try(
						tester, 
						'CSS', 
						function ( variant ) { return self.isSupported( variant ); }
					);
				if( !converted ) 
					continue;

				//	If some prefix has been used to reach support, 
				//	save information of that prefix.
				for( var name in properties ) {
					var original = properties[ name ];
					Translate.add( original, VendorPrefixes.make( original, 'CSS' ) );
				}
			}
			GetEvent = ( function () {
				var example = document.createElement( '_' ), 
					styles = example.style, 
					events = { transition: [ 'End' ], animation: [ 'Start', 'Iteration', 'End' ] }, 
					translations = _();
				function Checker( property ) { return HasOwn(styles, property); };
				for( var name in events ) {
					if( VendorPrefixes.try( name, 'css', Checker ) ) {
						var postfixes = events[ name ], 
							i = 0;
						for( ; i < postfixes.length; i++ ) {
							var postfix = postfixes[ i ];
							translations[ name + postfix.toLowerCase() ] = VendorPrefixes.make( name + postfix, 'event' );
						}
					}
				}
				return function GetEvent( event ) { return translations[ event ] || event.toLowerCase(); };
			} ) ();
		} ) ( {
			animations: {
				name: 'animation-name', 
				iterations: 'animation-iteration-count', 
				playState: 'animation-play-state', 
				duration: 'animation-duration', 
				delay: 'animation-delay', 
				direction: 'animation-direction', 
				easing: 'animation-timing-function', 
				fillMode: 'animation-fill-mode', 
				all: 'animation'
			}, 
			transitions: {
				property: 'transition-property', 
				duration: 'transition-duration', 
				easing: 'transition-timing-function', 
				delay: 'transition-delay', 
				all: 'transition'
			}
		} );
		return self;
	} ) ();

	/**
	 * Function to convert given properties to full list of it.
	 * For example, this converts margin to [margin-top, margin-right, margin-bottom, margin-left].
	 * @param	{HTMLElement}	element		Element, on which to try to convert those properties.
	 * @param	{ArrayLike}		properties	Properties list.
	 * @param	{Boolean}		if_diff		If true, returns null if property is not converted to anything (optional).
	 * @return	
	 */
	var ConvertProperties = ( function () {
		var cached_converts = _();
		function Converted( style, property ) {
			var i = style.length, 
				converted = [];
			while( i-- ) {
				var property = style[ i ];
				if( HasOwn( CSSAnimatedProperties, property ) )
					converted.push( property );
			}
			style.cssText = '';
			return cached_converts[ property ] = converted;
		};
		return function ConvertProperties( element, properties, if_diff ) {
			if( !IsArrayLike( properties ) ) 
				properties = [ properties ];

			var result = [], 
				styles = element.style, 
				new_properties = [], 
				i = properties.length;

			while( i-- ) {
				var property = properties[ i ];
				if( HasOwn( cached_converts[ property ] ) ) {
					ArrayPush.apply( result, cached_converts[ property ] );
				} else {
					new_properties.push( property );
				}
			}

			if( new_properties.length ) {

				//	Ignoring mutations of this element starting from now.
				TransitionStart.ignoreMutations.start( element );
				var old_styles = element.style.cssText;

				//	Emptying style attribute of this element to convert.
				element.style.cssText = '';

				var i = new_properties.length;
				while( i-- ) {
					var property = new_properties[ i ];
					if( IsString( property ) ) {
						styles[ property ] = 'inherit';
						ArrayPush.apply( result, Converted( styles, property ) );
					}
				}

				//	Bringing back all styles of this element.
				element.setAttribute( 'style', old_styles );

				//	Stopping mutation records ignoring.
				TransitionStart.ignoreMutations.end( element );
			}

			//	Stopping mutations ignorance.
			return !result.length ? false : ( result.length != 1 || result[0] !== property || !if_diff ) && result || null;
		};
	} ) ();
	var Handlers = ( function () {
		var self = {}, 
			is_api_ready = false, 
			ignore_next = false, 
			cached_calls = [], 
			data_key = 'transition-start-event-handlers';

		var CheckEventName = ( function () {
			var regex = /^[a-z]+$/i;
			return function CheckEventName( name ) {

				//	Converting name to string
				name = ToString( name );
				return name && regex.test( name );
			};
		} ) ();
		function GetData( element, dont_create ) {
			var value = element[ data_key ];
			if( !value && !dont_create ) {
				value = _();
				Object.defineProperties( value, {
					capturings: { value: _() }, 
					bubblings: { value: _() }, 
					properties: { value: _() }
				} );
				Object.defineProperty( element, data_key, { value: value } );
			}
			return value;
		};

		self.ignoreNextTransitionStart = function () { ignore_next = true; };
		self.add = function ( name, handler, args, original ) {
			var is_transitionstart = name == 'transitionstart' && !ignore_next && IsFunction( handler ) && CheckEventName( name );
			ignore_next = false;
			if( is_transitionstart ) {
				if( !is_api_ready ) {
					cached_calls.push( [this, arguments, self.add] );
					return;
				}
				args = Slice( args );
				var properties = ConvertProperties( this, args[ 2 ] ), 
					capturing = false;
				RemoveFrom( args, 2 );
				if( !properties )
					throw new Error( 'To use transitionstart event, pass property list which you want to track.' );

				if( args.length > 2 )
					SetLast( args, capturing = !!GetLast( args ) );
			}
			var result = original.apply( this, args );
			if( is_transitionstart ) {
				AddHandler( this, handler, properties, capturing );
			}
			return result;
		};
		self.remove = function ( name, handler, args, original ) {
			var is_transitionstart = name == 'transitionstart' && IsFunction( handler ) && CheckEventName( name );
			if( is_transitionstart && !is_api_ready ) {
				cached_calls.push( [this, arguments, self.remove] );
				return;
			}
			var result = original.apply( this, args );
			if( is_transitionstart ) 
				RemoveHandler( this, handler, capturing );
			return result;
		};

		function AddHandler( element, handler, properties, capturing ) {
			var data = GetData( element ), 
				container = data[ capturing ? 'capturings' : 'bubblings' ], 
				key = ObjectID( handler ), 
				props_object = NativeSupport ? ObjectFillKeys( properties ) : TransitionStart.addProps( element, properties ), 
				hooked = Natives.hook( handler, {fake: false}, function ( original ) {
					return function ( event ) {
						if( HasOwn( props_object, event.propertyName ) )
							return original.apply( this, arguments );
					};
				} );

			data.properties[ ObjectID( hooked ) ] = properties;

			if( container[ key ] ) 
				self.remove( element, handler, capturing );
			container[ key ] = hooked;
			return hooked;
		};
		function RemoveHandler( element, handler, capturing ) {
			var data = GetData( element ), 
				container = data[ capturing ? 'capturings' : 'bubblings' ], 

				//	Removing hooked function information.
				hooked = PopProp( container, ObjectID( handler ) );

			if( !NativeSupport ) 
				TransitionStart.removeProps( element, PopProp( data.properties, ObjectID( hooked ) ) );

			return hooked;
		};
		self.ready = function () {
			is_api_ready = true;
			var i = 0;
			for( ; i < cached_calls.length; i++ ) {
				var info = cached_calls[ i ];
				info[2].apply( info[0], info[1] );
			}
		};
		return self;
	} ) ();

	var CSSPseudoClassEvents = ( function () {
		var self = {}, 
			data_key = 'transition-start-css-pseudo-class-has-event-handler', 
			current_event_object = null, 

			//	Pseudoclass events.
			//	This ones needs to bound to the element directly.
			local_events = { mouseenter: 0, mouseleave: 0, focus: 0, blur: 0 }, 

			//	This will be filled after initialization.
			//	Those events will be bound to window.
			global_events = _();

		/**
		 * Pseudoclass event handler.
		 */
		function PseudoClassListener( event ) {
			if( current_event_object !== event )
				current_event_object = event;
			if( event.target[ data_key ] ) 
				TransitionStart.eventHandler.apply( this, arguments );
		};

		/**
		 * Binds part of css pseudoclass handlers.
		 * @param	{HTMLElement}	element	Target element to which you need to bind events.
		 */
		self.bind = function ( element ) {
			if( !HasOwn( element, data_key ) ) {
				Object.defineProperty( element, data_key, {
					value: true, 
					writable: true
				} );

				for( var event in local_events ) 
					element.addEventListener( event, PseudoClassListener );
			}
		};

		/**
		 * Unbinds part of css pseudoclass handlers.
		 * @param	{HTMLElement}	element	Target element from which you need to unbind events.
		 */
		self.unbind = function ( element ) {
			if( HasOwn( element, data_key ) ) {
				element[ data_key ] = false;

				for( var event in local_events ) 
					element.removeEventListener( local_events[i], PseudoClassListener );
			}
		};

		/**
		 * Checks if given event object is a CSS pseudoclass event, 
		 * and target has a handler for it.
		 * @param	{Event}	event	Event object, which need's to be checked.
		 */
		function IsLocalEvent( event ) {
			var target = event.target;
			return HasOwn( local_events, event.type ) && target[ data_key ] && target[ data_key ].value;
		};

		/**
		 * Geting parent list of target. 
		 * @param	{HTMLElement}	target	Event.path polyfill for events.
		 * @return	{Array}					Returns parent list of given element.
		 */
		function GetParents( event ) {
			var path = event.path;
			if( path ) {
				var i = path.indexOf( Body );
				return i != -1 && path.slice( 0, i );
			}
			path = path || [];
			var target = event.target, 
				not_body = false;
			do { path.push( target ); } while( (target = target.parentNode || target.shadowRoot || target.host) && (not_body = target != Body) );
			return not_body && path;
		};

		/**
		 * This function runs transitionstart event handlers for given event target.
		 * It get's the all elements that will be propagated because of this call, 
		 * and calls all handlers of that elements.
		 */
		function RunHandlersFor( event, args ) {
			var path = GetParents( event );
			if( !path )
				return;

			var i = 0;
			for( ; i < path.length; i++ ) {
				var target = path[ i ];
				if( target[ data_key ] ) 
					TransitionStart.eventHandler.apply( target, args );
			}
		};
		self.ready = function () {
			if( NativeSupport ) 
				return;

			//	Binding some events to window.
			//	Done this, because this works even if event handlers call stopPropagation.
			//	transitionend event is needed on window to know where transition ends for properties.
			//	animationend event is needed to again try to catch transitionstart event because transition can't run during animation.
			[ GetEvent('transitionend'), GetEvent('animationend'), 'mouseup', 'mousedown' ].forEach( function ( event, i ) {
				var is_transitionend = !i;
				window.addEventListener( event, global_events[ event ] = function ( event ) {
					if( current_event_object !== event ) {
						current_event_object = event;

						//	Running handlers for this event target.
						if( is_transitionend )
							TransitionStart.endedFor( event.target, event.propertyName );
						RunHandlersFor( event, arguments );
					}
				}, true );
			} );

			//	Hooking stopImmediatePropagation to handle situations when native handlers will not be called.
			Natives.hook( 'Event.prototype.stopImmediatePropagation', function ( original ) {
				return function () {
					var result = original.apply( this, arguments ), 
						handler;
					if( this !== current_event_object && ((handler = event2handler( event )) || IsLocalEvent( event )) ) {
						if( handler ) {
							handler.call( window, this );
						} else {
							TransitionStart.eventHandler.apply( event.target, event );
						}
					}
					return result;
				}
			} );
		};
		return self;
	} ) ();

	var TransitionStart = ( function () {
		var self = {}, 
			data_key = 'transition-start-handler-info';

		/**
		 * This method turns off transition of given properties.
		 * @param {HTMLElement}	target			Element which transition of given properties you need to turn off.
		 * @param {Array}		remove_these	Remove transition of this properties.
		 * @param {Object}		keep_delay		Collects delays of properties of transitions in milliseconds, 
		 *                              		so this is an OUT parameter.
		 */
		var DisableTransitionOf = ( function () {
			var all_animated_properties = Object.keys( CSSAnimatedProperties );
			var ConvertToMS = ( function () {
				var regex = /^(-?[\d+\.\-]+)(ms|s)$/i;
				return function ConvertToMS( value ) {
					var result = value.match( regex ), 
						unit = result[2], 
						numeric = parseFloat( result[1] );
					if( unit == 's' )
						numeric *= 1000;
					return numeric;
				};
			} ) ();
			function Trim( value ) { return value.trim(); };
			function GetTransition( target ) {
				var result = CSS.get( target, [
					'transition-property', 
					'transition-duration', 
					'transition-timing-function', 
					'transition-delay'
				] );
				for( var name in result ) {
					var value = result[ name ];
					result[ name ] = value.split( ',' ).map( Trim );
				}
				return result;
			}
			return function DisableTransitionOf( target, remove_these, keep_delays ) {
				remove_these = ObjectFillKeys( remove_these );

				var originals = GetTransition( target ), 

					properties = originals[ 'transition-property' ], 
					durations = originals[ 'transition-duration' ], 
					easings = originals[ 'transition-timing-function' ], 
					delays = originals[ 'transition-delay' ], 

					properties_parsed = _(), 
					new_transition = '', 

					removed_properties = false, 

					j = -1, 
					i = properties.length;
				while( i-- ) {
					if( j >= 0 && j >= i ) 
						j = -1;

					var property = properties[ i ], 
						ind = j >= 0 ? j : i, 
						orig_delay = delays[ ind ], 
						orig_duration = durations[ ind ], 
						delay = ConvertToMS( orig_delay ), 
						duration = ConvertToMS( orig_duration ), 
						parsed_already = HasOwn( properties_parsed, property ), 
						translateds = null;

					//	If information about this property is already parsed, ignore it.
					if( parsed_already || HasOwn( remove_these, property ) ) {
						if( !parsed_already && (duration + delay) ) {
							removed_properties = true;
							keep_delays[ property ] = Math.max( delay, 0 );
						}
						continue;
					}
					properties_parsed[ property ] = true;

					//	If given property value is all, convert all to properties list.
					if( j == -1 && ( property == 'all' || (translateds = ConvertProperties( target, property, true )) ) ) {
						translateds = translateds || all_animated_properties;
						RemoveFrom( properties, i );
						InsertAt( properties, translateds, i );
						j = i;
						i += translateds.length;
						continue;
					}
					new_transition = property + ' ' + orig_duration + ' ' + easings[ ind ] + ' ' + orig_delay + ', ';
				}

				//	If no property was deleted from transition, dont change anything.
				return removed_properties && (IsObjectEmpty( properties_parsed ) ? 'none' : new_transition.slice( 0, -2 ));
			};
		} ) ();

		/**
		 * Checks for possible transition start for given properties on given element.
		 * @param	{HTMLElement}	target		Target on which to check.
		 * @param	{Array}			properties	Properties list to check.
		 * @return	{Array} 					Returns properties on which transition start will not occur.
		 */
		function CheckTransitionStart( target, properties ) {
			var old_style_attr = target.style.cssText, 
				delays = _(), 
				changeds = [], 
				remained_same = [], 
				old_values = CSS.get( target, properties ), 
				changed_transition = DisableTransitionOf( target, properties, delays );

			if( changed_transition ) {

				//	Taking records of mutation observer of this element.
				self.ignoreMutations.start( target );

				//	Changing transition value to the one with disabled needed properties.
				CSS.set( target, { transition: changed_transition } );

				//	First HACK!
				//	If value of this property has been changed, 
				//	it means that this will animate using transition.
				var new_values = CSS.get( target, properties );
				for( var property in new_values ) {
					if( old_values[ property ] == new_values[ property ] ) {
						remained_same.push( property );
					} else {
						changeds.push( property );
					}
				}

				//	Fixing old values of needed properties.
				CSS.set( target, old_values );

				//	Second HACK!
				//	Reading changed property values to trigger rerendering.
				CSS.get( target, changeds );

				//	Filtering properties to ones that have numeric value only, and properties that are changed.
				target.setAttribute( 'style', old_style_attr );

				self.ignoreMutations.end( target );

				//	Starting all property animations that wanted.
				//	If this property is already animating stop immediatly and call new one.
				var i = changeds.length;
				while( i-- ) {
					var property = changeds[i];
					TransitionStart.fire( target, property, delays[ property ] );
				}
			} else {
				remained_same = properties;
			}
			return remained_same;
		};
		var TriggerEvent = ( function () {
			function PrepareObject( event, property ) {
				Object.defineProperty( event, 'propertyName', {
					value: property, 
					enumerable: true
				} );
				return event;
			}
			var MakeObject = ( function () {
				try {

					//	Trying to create event object from Event class constructor
					new TransitionEvent( 'test' );

					//	If succeed, then it's supported
					return function MakeObject( name, property ) {
						return PrepareObject( new CustomEvent( name, {
							bubbles: true, 
							cancelable: false
						} ), property );
					};
				} catch( err ) {

					//	If not, we can use old fashioned way
					return function MakeObject( name, property ) {
						var event = document.createEvent( 'CustomEvent' );
						event.initCustomEvent( name, true, false, undefined );
						return PrepareObject( event, property );
					};
				}
			} ) ();

			/**
			 * Triggers transitionstart event on given element for given property.
			 */
			return function TriggerEvent( element, property ) {
				var event = MakeObject( 'transitionstart', property );
				element[ data_key ].properties[ property ] = true;
				return element.dispatchEvent( event );
			};
		} ) ();

		/**
		 * Returns property list of this element, which are not animating now.
		 */
		function GetFreeProperties( element ) {
			var container = element[ data_key ];
			if( !container )
				return false;

			var properties = container.properties, 
				list = [];
			for( var property in properties ) {
				if( !properties[ property ] )
					list.push( property );
			}
			return list;
		};

		/**
		 * This api controls mutation records to prevent infinite calls.
		 * Mutation observers are needed to detect any attribute changes on elements, 
		 * to check if transition is started or not.
		 */
		self.ignoreMutations = ( function () {
			var self = {}, 
				saveds = _();

			/**
			 * Call this function when starting changes which need to be ignored.
			 * @param	{HTMLElement}	target	Element for which to start ignore mutations.
			 */
			self.start = function ( target ) {
				var key = ObjectID( target );
				if( !saveds[ key ] )
					saveds[ key ] = target && target[ data_key ] && target[ data_key ].observer.takeRecords();
			};

			/**
			 * Call this function when changes that need to be ignored are done to be able to track attribute mutations again.
			 * @param	{HTMLElement}	target	Element for which ignoring changes are ended.
			 */
			self.end = function ( target ) {
				var key = ObjectID( target );
				if( saveds[ key ] ) {
					target && target[ data_key ] && target[ data_key ].observer.takeRecords();
					if( saveds[ key ].length )
						Immediates.set( MutationListener, saveds[ key ] );
					delete saveds[ key ];
				}
			};
			return self;
		} ) ();

		/**
		 * Mutation observer listener.
		 */
		function MutationListener( mutations ) {
			var i = 0;
			for( ; i < mutations.length; i++ ) 
				self.eventHandler.call( mutations[i].target );
		};

		/**
		 * Mutation observer making method.
		 * Makes mutation observer to track attribute changes of given element.
		 * Binds MutationListener to mutation observer.
		 */
		function MakeObserver( element ) {
			var observer = new Natives.$.MutationObserver( MutationListener );
			observer.observe( element, { attributes: true } );
			return observer;
		};

		/**
		 * Checks if transitionstart is bound to given element.
		 */
		function IsActive( element ) {
			var info = element[ data_key ];
			return info && info.observer;
		};

		/**
		 * Unsets transitionstart event information from given element.
		 */
		function UnsetEvents( element ) {
			if( IsActive( element ) ) {
				if( element[ data_key ] ) {
					var observer = element[ data_key ].observer;
					observer.disconnect();
					element[ data_key ].observer = null;
				}
				CSSPseudoClassEvents.unbind( element );
			}
		};
		function SetEvents( element ) {
			if( !IsActive( element ) ) {
				if( !element[ data_key ] ) {
					value = _();
					Object.defineProperties( value, {
						observer: { value: null, writable: true }, 
						properties: { value: _() }, 
						delayTimeouts: { value: _() }
					} );
					Object.defineProperty( element, data_key, { value: value } );
				}
				element[ data_key ].observer = MakeObserver( element );
				CSSPseudoClassEvents.bind( element );
			}
		};

		/**
		 * Adding properties of element that need to be tracked for transitionstart event.
		 * @param  {HTMLElement}	element		Element on which you need to track for transitionstart event.
		 * @param  {Array}			properties	CSS properties to track.
		 * @return {Object}						
		 */
		self.addProps = function ( element, properties ) {

			//	Initializing element for transitionstart event.
			SetEvents( element );

			//	Geting information container of this element.
			var container = element[ data_key ], 
				as_keys = ObjectFillKeys( properties );

			//	Adding given properties to properties container.
			for( var property in as_keys ) {
				if( !HasOwn( container.properties, property ) ) 

					//	False means that this property is not busy(not being animated now),
					container.properties[ property ] = false;
			}
			return as_keys;
		};

		/**
		 * Event handler to call on every possible change.
		 * Changes that are being tracked are CSS pseudoclass events, attribute mutations and media query changes.
		 * @param	{Event}		event	Event object for that particular event (optional).
		 */
		self.eventHandler = function ( event ) {
			var list = GetFreeProperties( this );
			if( list && list.length ) {

				//	Checking for transition start for given properties.
				//	This function returns properties, which values have not been changed.
				//	This is needed to cancel transitionstart event for properties that where busy, but will not animate.
				var same_values = CheckTransitionStart( this, list );
				if( same_values.length ) {
					var container = this[ data_key ], 
						properties = container.properties, 
						timeouts = container.delayTimeouts, 
						i = same_values.length;
					while( i-- ) {
						var property = same_values[ i ], 
							timeout = PopProp( timeouts, property );

						//	If there is delay timeout, delete it.
						if( timeout )
							clearTimeout( timeout );

						//	Freeing property.
						properties[ property ] = false;
					}
				}
			}
		};

		/**
		 * Will be called when transition ends on given property on given element.
		 */
		self.endedFor = function ( element, property ) {
			var container = element[ data_key ];
			if( !container )
				return;

			var properties = container.properties, 
				timeout = PopProp( container.delayTimeouts, property );

			if( timeout ) 
				clearTimeout( timeout );
			properties[ property ] = false;
		};

		/**
		 * Stop tracking transitionstart event on given element for given properties.
		 */
		self.removeProps = function ( element, properties ) {
			var container = element[ data_key ];
			if( !container )
				return;

			var i = properties.length;
			while( i-- ) 
				delete container.properties[ properties[i] ];

			if( IsObjectEmpty( container ) )
				UnsetEvents( element );
		};

		/**
		 * Fire transitionstart event on element for property after delay mss.
		 */
		self.fire = function ( element, property, delay ) {
			var container = element[ data_key ];
			if( !container )
				return;

			var timeouts = container.delayTimeouts;
			if( !HasOwn( container.properties, property ) )
				return;

			if( timeouts[ property ] ) 
				clearTimeout( PopProp( timeouts, property ) );

			if( delay ) {
				timeouts[ property ] = setTimeout( function () {
					delete timeouts[ property ];
					TriggerEvent( element, property );
				}, delay );
			} else {
				TriggerEvent( element, property );
			}
		};

		//	Hooking addEventListener and removeEventListener calls.
		( function () {
			var list = [], support_checker;

			if( window.EventTarget ) {
				list.push( 'EventTarget' );
				support_checker = IsElement.only;
			} else {
				list.push( 'HTMLElement' );
			}

			function Maker( original, hooker, checker ) {
				function Hooked( name, handler ) { return hooker.call( this, name, handler, arguments, original ); };
				return checker ? 
					function ( name, handler ) { return ( checker( this ) ? Hooked : original ).apply( this, arguments ); } : 
					Hooked;
			};

			//	Hooking adding and removing methods for event handlers
			while( list.length ) {
				var base = list.pop() + '.prototype.';

				//	Hooking native functions
				Natives.hook( base + 'addEventListener', Maker, Handlers.add, support_checker );
				Natives.hook( base + 'removeEventListener', Maker, Handlers.remove, support_checker );
			}
		} ) ();
		return self;
	} ) ();

	//	Calling initialize on document ready.
	( function ( Initialize ) {
		if( document.readyState == 'complete' ) {
			Initialize();
		} else {
			document.addEventListener( 'DOMContentLoaded', Initialize );
		}
	} ) ( function () {
		Body = document.getElementsByTagName( 'body' )[0];

		//	Testing for native transitionstart event support now.
		var event_tester = document.createElement( 'div' );

		//	Making tester element invisible, but be open for transition events.
		CSS.set( event_tester, {
			position: 'fixed', 
			top: '0px', 
			right: '0px', 
			height: '0px', 
			width: '0px', 
			opacity: '1', 
			transition: 'opacity 0.1ms', 
		} );

		//	Ignoring this transitionstart binding event.
		Handlers.ignoreNextTransitionStart();

		//	Binding transitionstart event on tester element.
		event_tester.addEventListener( 'transitionstart', function () {

			//	transitionstart will be called before transitonend.
			NativeSupport = true;
		} );

		//	Binding transitionend event on tester element.
		//	Initialize all APIs here.
		event_tester.addEventListener( GetEvent('transitionend'), function () {

			//	Removing tester element from body.
			Body.removeChild( event_tester );

			//	If start called is true, then transitionstart event is supported, else initialize this.
			CSSPseudoClassEvents.ready();
			Handlers.ready();
		} );

		Body.appendChild( event_tester );
		setTimeout( function () {

			//	Firing transition.
			CSS.set( event_tester, { opacity: 0 } );
		}, 0 );
	} );
} ) ();