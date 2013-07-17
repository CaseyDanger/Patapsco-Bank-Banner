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

/** @constant */
var IMAGE_LOADER_INITIALIZE = 'ImageLoaderInitialize';
/** @constant */
var IMAGE_LOADER_COMPLETE = 'ImageLoaderComplete';
/** @constant */
var BANNER_NAVIGATION_MOUSE_OVER = 'BannerNavigationMouseOver';
/** @constant */
var BANNER_NAVIGATION_MOUSE_OUT = 'BannerNavigationMouseOut';
/** @constant */
var BANNER_NAVIGATION_MOUSE_DOWN = 'BannerNavigationMouseDown';
/** @constant */
var BANNER_NAVIGATION_NAVIGATE = 'BannerNavigationNavigate';
/** @constant */
var BANNER_PLAYBACK_ADVANCE = 'BannerPlaybackAdvance';
/** @constant */
var BANNER_PLAYBACK_START = 'BannerPlaybackStart';
/** @constant */
var BANNER_PLAYBACK_STOP = 'BannerPlaybackStop';
/** @constant */
var BANNER_PLAYBACK_TOGGLE = 'BannerPlaybackToggle';
/** @constant */
var BANNER_TIMER_INCREMENT = 'BannerTimerIncrement';


/**
 * Creates a new Banner object.
 *
 * @param {object} options Banner options.
 * @param {string} options.banner Identifies banner css id.
 * @param {string} options.bannerPreloader Identifies preloader id.
 * @param {string} options.bannerNavigation Navigation buttons selector.
 * @param {string} options.bannerPlayback Playback buttons selector.
 * @param {string} options.bannerSlides Banner slides selector.
 * @param {boolean} options.lazyLoadNextSlide Preloads the assets for the next slide once it is done with the current one.
 * @param {int} options.duration Duration of slide playback in milliseconds.
 * @param {boolean} options.autoPlay Automatic rotation of slides.
 * @param {boolean} options.shuffle Shuffle slides and nav
 * @param {boolean} options.navEvents Attempts to automate events for the navigation buttons on slidechange.
 */
function Banner(options){

	var options = this.options = options;
	var element = this.element = $j(options.banner);
	
	var bannerPreloader,
		bannerAssets,
		bannerTimer,
		bannerNavigation,
		bannerPlayback,
		bannerSlides,
		slideIndex;
	
	/** Init Banner */
	this.initialize = function(){

		//Binds Banner event listeners
		element
			.bind(IMAGE_LOADER_INITIALIZE, function(event){
				bannerPreloader.show();
			})
			.bind(IMAGE_LOADER_COMPLETE, function(event, images){
				//All images for this slide were loaded
				bannerPreloader.hide();

				//Runs imagesReady() on bannerSlides once, after images are loaded
				if(!images.displayed){
					bannerSlides.imagesReady(images);
					images.displayed = true;
				}

				//If images for this slideIndex are defined
				if(images.slideID !== undefined){

					bannerSlides.slideEnter(images.slideID); //play this slide

					//Starts timer if autoplay is set to true
					if(options.autoPlay){
						if (bannerTimer) {
							bannerTimer.start();
						}
					}
				}
			})
			.bind(BANNER_TIMER_INCREMENT, function(event){
				autoAdvance(); //On timer tick, calls next slide.
			});
		
		//New banner preloader from selector
		if(options.bannerPreloader){
			bannerPreloader = new BannerPreloader();
		}
		
		if(options.bannerSlides){

			//shuffle
			if(options.shuffle){
				if (options.bannerNavigation) {
					shuffleBanner({"slides": options.bannerSlides, "nav": options.bannerNavigation}); // shuffles slides and nav
				}else{
					shuffleBanner({"slides": options.bannerSlides}); // shuffles slides only
				}
			}

			//banner assets are generated from the html selector
			bannerAssets = getAssets();
		}
		
		//Initialize banner timer
		if(options.autoPlay){
			if (options.duration === undefined) options.duration = 8000;
			bannerTimer = new BannerTimer(options.duration);
		}
		
		//Initialize navigation if set
		if(options.bannerNavigation){
			bannerNavigation = new BannerNavigation(options.bannerNavigation);
			bannerNavigation.element
				.bind(BANNER_NAVIGATION_MOUSE_OVER, function(event, index){
					bannerSlides.mouseOver(index);
				})
				.bind(BANNER_NAVIGATION_MOUSE_OUT, function(event, index){
					bannerSlides.mouseOut(index);
				})
				.bind(BANNER_NAVIGATION_MOUSE_DOWN, function(event, index){
					if (bannerTimer) {
						bannerTimer.stop(); // stops autoadvance if user changes the slide manualy
						options.autoPlay = false;
					}
					bannerSlides.mouseDown(index);
				})
				.bind(BANNER_NAVIGATION_NAVIGATE, function(event, index){
					navigate(index);
				});
			bannerNavigation.initialize();
		}
		
		//Initialize Playback if set
		if(options.bannerPlayback){
			bannerPlayback = new BannerPlayback(options.bannerPlayback);
			bannerPlayback.element
				.bind(BANNER_NAVIGATION_MOUSE_OVER, function(event, index){
					bannerSlides.mouseOver(index);
				})
				.bind(BANNER_NAVIGATION_MOUSE_OUT, function(event, index){
					bannerSlides.mouseOut(index);
				})
				.bind(BANNER_NAVIGATION_MOUSE_DOWN, function(event, index){
					if (bannerTimer) {
						if ($j(event.target).hasClass('next') || $j(event.target).hasClass('prev')) {
							bannerTimer.stop();
							options.autoPlay = false;
						}
					}
					bannerSlides.mouseDown(index);
				})
				.bind(BANNER_PLAYBACK_ADVANCE, function(event, index){
					advance(index);
				})
				.bind(BANNER_PLAYBACK_START, function(event){
					if (bannerTimer) {
						options.autoPlay = true;
						bannerTimer.start();
					}
					
				})
				.bind(BANNER_PLAYBACK_STOP, function(event){
					if (bannerTimer) {
						bannerTimer.stop();
						options.autoPlay = false;
					}
				})
				.bind(BANNER_PLAYBACK_TOGGLE, function(event){
					if(options.autoPlay){
						bannerTimer.toggle();
					}
				});
			bannerPlayback.initialize();
		}
		
		//initialize banner slides
		bannerSlides = new BannerSlides();
		bannerSlides.initialize();
		
		//shows first slide
		autoAdvance();
	};

	//Calls next slide
	var autoAdvance = function(){
		advance(1);
	};
	
	// calls specific slide by index
	var navigate = function(value){
		setSlideIndex(value);
	};
	
	//Advances 1 or -1 for next or previous
	var advance = function(value){
		
		var targetIndex = slideIndex + value;
		var bannerSlidesLength = $j(options.bannerSlides).length;

		if(slideIndex === undefined){
			targetIndex = 0;
		}else{
			if(targetIndex >= bannerSlidesLength){
				targetIndex = 0;
			}else if(targetIndex < 0){
				targetIndex =  bannerSlidesLength - 1;
			}
		}
		
		//Attempts to handle the navigation states by itslef if bannerNavigation is set to true
		if(options.bannerNavigation){
			if (options.navEvents) {
				bannerNavigation.buttonMouseOver(targetIndex);
				bannerNavigation.buttonMouseDown(targetIndex);
			}
		}

		setSlideIndex(targetIndex);
	};
	
	//Preloads all assets for this slide
	var preloadAssets = function(index){
		var loaded = false;

		// Loads all assets for this slide if not loaded yet
		$j.each(bannerAssets, function(i){
			if(this.data.slideID === index && this.data.loaded === false){
				this.load(false); //not lazy
				loaded = true;
			}
		});

		// Preloads next slide if lazyLoadNextSlide is set to true
		if (options.lazyLoadNextSlide){
			var nextSlideIndex = (index+1);
			if (nextSlideIndex !== undefined) lazyPreloadAssets(nextSlideIndex);
		}
		
		return loaded;
	};

	//Preloads all assets for the next slide
	var lazyPreloadAssets = function(index){
		var loaded = false;
		$j.each(bannerAssets, function(i){
			if(this.data.slideID === index && this.data.loaded === false){
				this.load(true); // lazy load
				loaded = true;
			}
		});
		return loaded;
	};

	//Loads specific slide set by ID
	var setSlideIndex = function(value){

		if(value != slideIndex){
			if (bannerTimer) bannerTimer.reset();
			if(slideIndex !== undefined){
				bannerSlides.slideExit(slideIndex);
			}
			slideIndex = value;
			
			//if there are no preload assets, or if assets are already preloaded, enter the next slide
			if(!preloadAssets(slideIndex)){
				bannerSlides.slideEnter(slideIndex);

				if(options.autoPlay){
					if (bannerTimer) {
						bannerTimer.start();
					}
				}
			}
		}
	};

	//Scrapes HTML for images (data-bg attribute on any html element inside bannerSlides)
	function getAssets() {

		var assets = [];
		var slides = $j(options.bannerSlides);
		var dataAttr = 'data-bg';
		var images = [];

		//Scrapes each slide for the attribute dataAttr
		slides.each(function(index) {

			var slide = $j(this);
			var attr = slide.attr(dataAttr);

			//Gets image from the main element if set (find/filter/children do not return the parent itself)
			if (typeof attr !== 'undefined' && attr !== false && attr !== undefined) addImage(attr, index, $j(this));

			//Gets images from its children
			var slideImages = slide.find('*['+dataAttr+']');

			slideImages.each(function() {
				addImage($j(this).attr(dataAttr), index, $j(this), 'img'+index);
			});

			//This filters the images for each slide and pushes the obj into the assets
			assets.push(getImagesForSlide(index));
		});

		function addImage(img, slideID, target) {
			images.push({'src': img,'slideID': slideID, 'targetContainer':target, 'type': 'background-image'});

		}

		//Selects all images in that slide to be loaded and returns a ImageLoader object containing these images
		function getImagesForSlide(slideID) {

			var tempImages = {};
			var totalImages = images.length;
			var rs = {};

			for (var i = 0; i < totalImages; i++) {
				var image = images[i];
				if (image.slideID === slideID){
					tempImages['image'+i] = image;
				}
			}

			rs.images = tempImages;
			rs.slideID = slideID;
			return new ImageLoader(rs);
		}

		return assets;
	}

	//Image preloader
	function ImageLoader(data){

		var data = this.data = data;

		//checks if IE8 or older
		var isIE8 = ($j.browser.msie && $j.browser.version <= "8.0");

		data.loaded = false;
		data.displayed = false;
		data.imagesArray = [];
		data.totalImages = 0;
		
		var load = this.load = function(lazy){

			if(!data.loaded){

				//If lazy load is false, broadcast preloader start
				if(!lazy) banner.element.trigger(IMAGE_LOADER_INITIALIZE);
				
				// preloads each image and sets the background for the target elements
				$j.each(data.images, function(key, value){

					var imageObj = {};
					var image = new Image();
					var img = imageObj.image = image;

					imageObj.targetContainer = this.targetContainer;

					image.onload = function(){

						imageObj.targetContainer.css({
							'background-image': 'url(' + img.src + ')'
						});
						imageObj.image = image;
						data.imagesArray.push(imageObj);

						// if done loading all images, broadcasts it is done
						if(data.imagesArray.length == data.totalImages){
							data.loaded = true;
							//If lazy load is false, broadcasts all asstes were loaded
							if(!lazy) banner.element.trigger(IMAGE_LOADER_COMPLETE, data);
						}
					};

					// if <= IE8 adds "cache buster";
					img.src = (isIE8 ? this.src+ "?" + new Date().getTime() : img.src = this.src);

					image.onerror = function(error){
						try{
							loadImage(source);
						}catch(error){
							//console.log('Image cannot be located');
						}
					};

					data.totalImages++;
				});

			//Skips preloader if the images were already loaded
			}else if(loaded){
				banner.element.trigger(IMAGE_LOADER_COMPLETE, data);
			}
		};
	}

	//Timer to control the autoplay/rotation
	function BannerTimer(duration){
	
		var duration = duration;
		var timer = {};
		var stopped = this.stopped = true;
		
		var counterInterval = 250;
		var counter = {};
		var currentTime = this.currentTime = 0;
		
		this.toggle = function(){
			if(stopped === true){
				start();
			}else if(stopped === false){
				stop();
			}
		};
		
		var start = this.start = function(){
			//Calculate timer duration (timer duration minus time ellapsed)
			var timeoutDuration = (duration - currentTime);
			//Clear timer
			clear();
			//Timer no longer stopped
			stopped = false;
			//Set timer
			timer = setTimeout(function(){
				banner.element.trigger(BANNER_TIMER_INCREMENT);
				currentTime = 0;
				start();
			}, timeoutDuration);
			//Set counter
			counter = setInterval(function(){
				currentTime += counterInterval;
			}, counterInterval);
		};
		
		var stop = this.stop = function(){
			//Clear timer
			clear();
			//Timer stopped
			stopped = true;
		};
		
		var reset = this.reset = function(){
			//Reset timer, set current time to 0
			stop();
			currentTime = 0;
		};
		
		var clear = this.clear = function(){
			clearTimeout(timer);
			clearInterval(counter);
		};
	}

	//All Events for BannerNavigation
	function BannerNavigation(element){
		
		var element = this.element = $j(element);
		var buttonIndex;
		
		this.initialize = function(){
			$j.each(element, function(buttonIndex){
				addEventListener(buttonIndex);
			});
		};
		
		var addEventListener = function(index){
			var button = element.eq(index);
			button
				.bind('mouseenter', function(event){
					buttonMouseOver(button.index());
				})
				.bind('mouseleave', function(event){
					buttonMouseOut(button.index());
				})
				.bind('mousedown', function(event){
					buttonMouseDown(button.index());
				});
		};
		
		var removeEventListener = function(index){
			var button = element.eq(index);
			button
				.unbind('mouseenter')
				.unbind('mouseleave')
				.unbind('mousedown');
		};
		
		var buttonMouseOver = this.buttonMouseOver = function(index){
			var button = element.eq(index);
			button.trigger(BANNER_NAVIGATION_MOUSE_OVER, {buttonIndex:index, buttonContainer:element});
		};
		
		var buttonMouseOut = this.buttonMouseOut = function(index){
			var button = element.eq(index);
			button.trigger(BANNER_NAVIGATION_MOUSE_OUT, {buttonIndex:index, buttonContainer:element});
		};
		
		var buttonMouseDown = this.buttonMouseDown = function(index){
			var button = element.eq(index);
			
			if(button.attr('class').match(/navigate/)){
				button.trigger(BANNER_NAVIGATION_NAVIGATE, index);
				setButtonIndex(index);
			}
			
			button.trigger(BANNER_NAVIGATION_MOUSE_DOWN, {buttonIndex:index, buttonContainer:element});
		};
		
		var setButtonIndex = this.setButtonIndex = function(value){
			if(buttonIndex != value){
				if(buttonIndex !== undefined){
					buttonMouseOut(buttonIndex);
					addEventListener(buttonIndex);
				}
				
				buttonIndex = value;
				
				removeEventListener(buttonIndex);
			}
		};
	}

	//All Events for BannerPlayback
	function BannerPlayback(element){
		
		var element = this.element = $j(element);
		
		this.initialize = function(){
			$j.each(element, function(elementIndex){
				addEventListener(elementIndex);
			});
		};
		
		var addEventListener = function(index){
			var button = element.eq(index);
			button
				.bind('mouseenter', function(event){
					buttonMouseOver(button.index());
				})
				.bind('mouseleave', function(event){
					buttonMouseOut(button.index());
				})
				.bind('mousedown', function(event){
					buttonMouseDown(button.index());
				});
		};
		
		var removeEventListener = function(index){
			var button = element.eq(index);
			button
				.unbind('mouseenter')
				.unbind('mouseleave')
				.unbind('mousedown');
		};
		
		var buttonMouseOver = this.buttonMouseOver = function(index){
			var button = element.eq(index);
			button.trigger(BANNER_NAVIGATION_MOUSE_OVER, {buttonIndex:index, buttonContainer:element});
		};
		
		var buttonMouseOut = this.buttonMouseOut = function(index){
			var button = element.eq(index);
			button.trigger(BANNER_NAVIGATION_MOUSE_OUT, {buttonIndex:index, buttonContainer:element});
		};
		
		var buttonMouseDown = this.buttonMouseDown = function(index){
			var button = element.eq(index);
			if(button.attr('class').match(/prev/)){
				button.trigger(BANNER_PLAYBACK_ADVANCE, -1);
			}else if(button.attr('class').match(/next/)){
				button.trigger(BANNER_PLAYBACK_ADVANCE, 1);
			}if(button.attr('class').match(/start/)){
				button.trigger(BANNER_PLAYBACK_START);
			}else if(button.attr('class').match(/stop/)){
				button.trigger(BANNER_PLAYBACK_STOP);
			}else if(button.attr('class').match(/toggle/)){
				button.trigger(BANNER_PLAYBACK_TOGGLE);
			}
			button.trigger(BANNER_NAVIGATION_MOUSE_DOWN, {buttonIndex:index, buttonContainer:element});
		};
	}

	function BannerPreloader(){

		var element = $j(options.bannerPreloader);
		this.show = function(){
			element
				.css({
					visibility: 'visible',
					opacity: 0
				})
				.animate({
					opacity:1
				}, 300);
		};
		this.hide = function(){
			element
				.animate({
					opacity:0
				}, 300, function(){
					element.css({
						visibility: 'hidden'
					});
				});
		};
	}

	function shuffleBanner (elements) {
		var nav = $j(elements.nav);
		var slides = $j(elements.slides);
		var shuffledNav = [];
		var shuffledSlides = [];
	
		function getRandom (max) {
	        return Math.floor(Math.random() * max);
	    }

	    if (nav.length > 0) {
	    	nav.each(function(index) {
		    	var random = getRandom(nav.length),
		            randNavEl = $j(nav[random]).clone(true)[0],
		            randSlideEl = $j(slides[random]).clone(true)[0];
		        shuffledNav.push(randNavEl);
		        shuffledSlides.push(randSlideEl);
		        nav.splice(random, 1);
		        slides.splice(random, 1);
		    });
		    nav = $j(elements.nav);
		    nav.replaceWith($j(shuffledNav));
		    slides = $j(elements.slides);
		    slides.replaceWith($j(shuffledSlides));
	    }
	    else{
	    	slides.each(function(index) {
		    	var random = getRandom(slides.length),
		            randSlideEl = $j(slides[random]).clone(true)[0];
		        shuffledSlides.push(randSlideEl);
		        slides.splice(random, 1);
		    });
		    slides = $j(elements.slides);
		    slides.replaceWith($j(shuffledSlides));
	    }
	}
}


