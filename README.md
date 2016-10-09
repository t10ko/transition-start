# JavaScript transitionstart event for modern browsers.

Once I needed this event for the app for my startup.  
I tried to find a javascript implementation for this event, but I could'nt find anything universal.  
There is one [solution](https://madebymike.com.au/writing/detecting-transition-start/), but it wont work in case of *transition: all*, also you need to be able to change CSS stylesheets and it still will not work if the particular property is not being changed.  
Only internet explorer supports this event natively( IE 10+ ).

This seemed impossible, but I accepted this big challange and decided to write a maximum precise implementation of **transitionstart** event.

Plugin requires **hooking-api** JS library.

This plugin is available via **bower**, also I installed bower compiler in the gulpfile.

## Usage.

Plugin changes native methods **addEventListener** and **removeEventListener**, so if you want to bind transitionstart event, write this.
```javascript
document.querySelector( '#target' ).addEventListener( 'transitionstart', function ( event ) {
    console.log( 'Transition started on property', event.propertyName );
}, [ 'height', 'width' ] );
```

Third argument is the property list for which you need to track transition changes.  
Did this to prevent performance issues.

## Differences.

Plugin will work a little different in case when animation and transition are running together on the same properties.  
In case of IE transitionstart event, transition start will be generated after the delay of the transition, but in this polyfill, it will be generated when animation is ended, but transition is still running.  
Anyway, this is a very rare case.

Also, if you use this plugin and even if current browser natively supports this event, you will still need to add property list when adding listener.

#### Plugin doesnt catch transitionstart in case of media query changes.

I can implement that part as well, but plugin will become much more larger and I don't know if that worths that effort.

Waiting for reviews, feedbacks, bugs, and hope you liked it. :)

## Browser support.

|Chrome|Firefox|IE |Opera|Safari|
|:----:|:-----:|:-:|:---:|:----:|
|18    |14     |10 |15   |6.0   |