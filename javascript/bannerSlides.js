/**
 * jsBanner library v1.0
 *
 * Includes jQuery
 * http://jquery.com/
 *
 * Original Author: Patrick Welborn
 *
 * Co-author: Pedro Canterini (changes, cleanup and documentation)
 * Date: Sep 4 2012
 *
 * COPYRIGHT © 2012 BANCVUE, LTD ALL RIGHTS RESERVED
 * https://www.bancvue.com/
 */

var banner; //banner variable with global scope

$j.extend(jQuery.easing,{
	easeInOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	}
});

$j.extend(jQuery.easing,{
		easeInOutQuart: function (x, t, b, c, d) {
				if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
				return -c/2 * ((t-=2)*t*t*t - 2) + b;
			}
});

/**
 * Banner setup is called from global.js
 * Don't forget to call this or you will just
 * get the static content of the first slide
 */
function setupBanner(){
	
	/**
	 * @constructor
	 * @type {Banner}
	 */
	banner = new Banner({
		banner: '#banner', // String identifying banner id
		bannerPreloader: '#bannerPreloader', // String identifying banner preloader id
		bannerNavigation: '#bannerNavigation .button', // String identifying banner navigation buttons
		bannerPlayback: '#bannerPlayback .button', // String identifying banner playback buttons
		bannerSlides: '#bannerSlides .slide', // String identifying banner slides
		lazyLoadNextSlide: false, //if set to true will preload the images for the next slide once it is done with the current
		duration: 3000, // Integer defining duration of slide playback in milliseconds
		autoPlay: true, // Boolean indicating whether slide show should auto play
		shuffle: false, // Shuffle slides and nav
		navEvents: false // Runs buttonMouseOver and buttonMouseDown (on the bannerNavigation buttons) on slidechange automatically
	});

	banner.initialize(); //INIT
}

/**
 * BannerSlides controls all events related to slides and navigation
 */
function BannerSlides(){

	var slides = $j('#bannerSlides .slide');
	var bannerNavigation = $j('#bannerNavigation');
	var slideCopy = $j('.slideContent .slideCopy');
	var picture = $j('#bannerSlides .picture');
	var slideCopyPos = slideCopy.position().top;
	var browser = $j.browser;
	var isIE8 = (browser.msie && browser.version <= "8.0");


	/**
	 * Initializes the banner
	 * Executes before the image preloader starts
	 */
	this.initialize = function(){
		bannerNavigation.removeClass('hide'); // show nav
		slides.addClass('hide'); // hides content while assets are loading
	};

	/**
	 * imagesReady is called when all images for a certain slide
	 * are done loadind. There is no need to append them 
	 * since background-image is set to the html target
	 */
	this.imagesReady = function(images){
		// If you need to target this slide use:
		// console.log($j('#bannerSlides .slide').eq(images.slideID));
		$j('.slideContent').show(); // brings content back after assets are loaded.

	};
	
	/**
	 * Triggered when the user rolls over a navigation button
	 * @param {Array} data Use data.buttonContainer to target the container
	 * and data.buttonIndex to target the button index
	 */
	this.mouseOver = function(data){
		//console.log($j(data.buttonContainer).eq(data.buttonIndex));
	};
	
	/**
	 * Triggered when the user rolls out of a navigation button
	 * @param {Array} data Use data.buttonContainer to target the container
	 * and data.buttonIndex to target the button index
	 */
	this.mouseOut = function(data){
		//console.log($j(data.buttonContainer).eq(data.buttonIndex));
	};
	
	/**
	 * Triggered when the user clicks a navigation button
	 * @param {Array} data Use data.buttonContainer to target the container
	 * and data.buttonIndex to target the button index
	 */
	this.mouseDown = function(data){
		//console.log($j(data.buttonContainer).eq(data.buttonIndex));
		//console.log('mouseDown'+data.buttonIndex);
	};
	
	/**
	 * Triggered when a new slide is set and runs before slideExit
	 * @param {int} index current slide index
	 */
	this.slideEnter = function(index){
		var navPos = $j('#bannerNavigation').position().left;
		var buttonPos = $j('#bannerNavigation .button').eq(index).position().left;
		distance = 10;

		slides.eq(index).removeClass('hide');


		//Animate Copy
		slideCopy.eq(index)
			.removeClass('hide')
			.css({
				'top' : (slideCopyPos - distance) + 'px',
				'opacity' :  0
			})
			.stop()
			.animate({
				'top' : slideCopyPos + 'px',
				'opacity' : 1
			}, {
				duration: 800,
				easing: 'easeInOutQuart'
			});

		//Animate Slide Image
		picture.eq(index)
			.css({
				'top' : picture.eq(index).height() + 'px'
			})
			.stop()
			.animate({
				'top' : 0,
			},{
				duration: 800,
				easing: 'easeInOutElastic'
			});

		//Animate Nav highlight
		$j('#bannerNavHiLite')
			.animate({
				'width' : $j('#bannerNavigation .button').eq(index).width() + 58 + 'px',
				'left' : (navPos + buttonPos) - 40
			},{
				duration: 800,
				easing: 'easeInOutElastic'			
			});

		$j('#bannerNavigation .button').eq(index).addClass('active')

	};
	
	/**
	 * Triggered when a new slide is set and runs after slideEnter
	 * @param {int} index current slide index
	 */
	this.slideExit = function(index){
		
		//Animate Copy out
		slideCopy.eq(index)
			.animate({
				'top' : (slideCopyPos + distance) + 'px',
				'opacity' : 0
			}, function(){
				slideCopy.eq(index).addClass('hide');
			})
		
		//Animate Picture out
		picture.eq(index)
			.stop()
			.animate({
				'top' : picture.eq(index).height() + 'px'
			},{
				duration: 800,
				easing: 'easeInOutElastic'
			});

		$j('#bannerNavigation .button').eq(index).removeClass('active');
			
	};
}