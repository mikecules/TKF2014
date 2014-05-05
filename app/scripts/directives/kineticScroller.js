'use strict';
// Written by Michael Moncada
// Kinetic Scroll Algorithm adopted from code and description
// http://ariya.ofilabs.com/2013/08/javascript-kinetic-scrolling-part-1.html

 angular.module('tkf2014App')
.constant('kCarouselEvents', {CARD_COUNT_REACHED_EVENT: 'carousel.event.cardCountReached'})
.directive('kineticScroller', function(kCarouselEvents, $parse, $swipe) {
  return {
   restrict: 'A',
   transclude: true,
   scope: true,
   templateUrl: 'views/kineticScroller.html',
   controller: function($scope) {
     var _cards = [];
     var _scrollableWidth = 0;
     var _cardWidth = 0;
     var _cardHeight = 0;

     // assume all cards are the same width;

     $scope.cardDeck = {};
     $scope.cardDeck.cards = _cards;
     $scope.cardDeck.selectedCardIndex = 0;



     $scope.getScrollableWidth = function() {
       return _scrollableWidth;
     };

     $scope.setScrollableWidth = function(w) {
       _scrollableWidth = w;
     };

     $scope.getCardHeight = function() {
       return _cardHeight;
     };

     $scope.setCardHeight = function(h) {
       _cardHeight = h;
     };

     $scope.getCardWidth = function() {
       return _cardWidth;
     };

     $scope.setCardWidth = function(w) {

       _cardWidth = w;
     };

     this.setMaxCardWidth = function(w) {

       if (_cardWidth === w) {
         return;
       }


       _cardWidth = w;

       _regenerateScrollableWidth(w);

     };

     function _regenerateScrollableWidth(w) {
       //console.log('width changed to ' + w + ' prev: ' + _scrollableWidth);
       _scrollableWidth = _cards.length * (w) + 20 * (_cards.length - 1);
       //console.log(' next: ' + _scrollableWidth, _cards.length);
     }

     this.pushCard = function(cardEl) {
       var cardElement = cardEl;

       if (angular.isObject(cardEl)) {
         _cards.push(cardEl);
       }
       else if (angular.isString(cardEl)) {
         cardElement = $(cardEl);

         if (cardElement.length > 0) {
           _cards.push(cardElement);
         }
       }



       if (cardElement.length > 0) {

         // ASSUMPTION: it is currently assumed that the cardWidth is constant across all cards otherwise the getCardWidth will return the maximum width it has seen
         // ASSUMPTION: it is currently assumed that the cardHeight is constant across all cards otherwise the cardHeight will return the maximum height it has seen
         var currentCardWidth = cardElement.width();
         var currentCardHeight = cardElement.height();


         $scope.setCardWidth(Math.max($scope.getCardWidth(), currentCardWidth));
         $scope.setCardHeight(Math.max($scope.getCardHeight(), currentCardHeight));
         //alert(currentCardWidth);

         _scrollableWidth =  _scrollableWidth + currentCardWidth + 20;
       }

       console.log('Cards Pushed: ', _cards , ' scrollable width: ' + _scrollableWidth);

       return true;
     };

     this.popCard = function() {

       if (_cards.length === 0) {
         console.error('The carousel does not contain any cards to pop!');
         return null;
       }


       var cardElement =  _cards.pop();

       if (cardElement.length > 0) {
         _scrollableWidth -= _cardWidth;
       }

       return cardElement;
     };

     this.popCardAtIndex = function(index) {

       if (! angular.isNumber(index) || index >= _cards.length) {
         console.error('There is no carousel card at index ' + index + ' there are only ' + _cards.length + ' cards!');
         return null;
       }


       var cardElement =  _cards.slice(index,(index + 1));

       if (cardElement.length > 0) {
         _scrollableWidth -= _cardWidth;
       }


       return cardElement;
     };



   },
   link: function(scope, element, attrs) {    // LINK FUNCTION ================================

     var scrollBarIndicator = element.find('.navigation-scroll-indicator');
     var carouselView = element.find('.carousel-container-view');

     var carouselCardSpacerWidth = 0;
     var cardWidth = 0;
     var isFirstRun = true;
     var criticalCardCount = 0;


     if (angular.isDefined(attrs.expectedCards)) {
       criticalCardCount = $parse(attrs.expectedCards)(scope);
     }


     function _init() {
       cardWidth = scope.getCardWidth();
       carouselCardSpacerWidth = element.find('.carousel-spacer:first').width();

       _recalcElementHeight();
       _recalculateScrollBarWidth();
     }





     /////
     function _recalcElementHeight() {
       //element.height((element.height() + element.find('.navigation-carousel-map').height() + 40) + 'px');
     }



     scope.cardAtIndex = function(i) {
       if (i >= 0 && i < scope.cardDeck.cards.length) {
         return  scope.cardDeck.cards[i];
       }

       return null;
     };

     scope.updateSelectedIndex = function(index) {

       // do something to the selected card code block...
       var card =  scope.cardAtIndex(index);

       if (card !== null) {
         $.each(scope.cardDeck.cards, function(i, theCard) {
            if (i !== index) {
              theCard.removeClass('selected');
            }
          });
         card.addClass('selected');


       }

       scope.cardDeck.selectedCardIndex = index;
     };


     $(window).resize(_init);



     function _recalculateScrollBarWidth() {
       var scrollableWidth = $(window).width();

       if (scope.cardDeck.cards.length < 1) {
         return;
       }

       var scrollBarWidth = scrollableWidth/scope.cardDeck.cards.length - 3;

       if (scrollBarWidth >= scrollableWidth) {
         scrollBarIndicator.hide();
       }
       else {
         scrollBarIndicator.show();
       }

       scrollBarIndicator.width(Math.ceil(scrollBarWidth) + 'px');
     }



     /////////////////////////////
     function _touchHandler() {
       var startX;
       var startY;
       var dx;
       var currentViewOffset = {x: 0, y: 0};
       var minViewOffset;

       var maxViewOffset;

       var currentFrameOffset;
       var targetOffset;

       var isTouchInProgress;
       var elementWidth;
       var scrollBarIndicatorWidth;
       var velocityOfSwipe;
       var amplitude;
       var frameTimeStamp;

       var ticker = null;
       var Tau; // exponential decay constant - the higher this number is the slower the decay and vice-versa

       var cardWidth;
       var cardWidthWithDivider;




       ///////////

       function _initVars() {
         elementWidth = element.width();
         scrollBarIndicatorWidth = scrollBarIndicator.width();
         velocityOfSwipe = {x: 0, y: 0};
         targetOffset = {x: 0, y:0};
         currentFrameOffset = {x: 0, y: 0};
         minViewOffset = {x: 0, y: 0};
         maxViewOffset = {x: 0, y: 0};
         maxViewOffset.x =  scope.getScrollableWidth();
         cardWidth = scope.getCardWidth();
         cardWidthWithDivider = cardWidth + carouselCardSpacerWidth;
         isTouchInProgress = false;
         startX = 0;
         startY = 0;
         dx = 0;
         amplitude = 0;
       }


       function _resetTau() {
         Tau = 325;
       }

       function _getCardIndexBasedOffOffset(proposedOffset) {
         var offset = angular.isNumber(proposedOffset) ? proposedOffset : currentViewOffset.x;

         var approxNumberOfCards = offset / (cardWidthWithDivider);
         console.log(approxNumberOfCards);
         var cardIndex = Math.min((scope.cardDeck.cards.length - 1), Math.round(approxNumberOfCards));

        if (cardIndex < 0) {
          return 0;
        }

         return cardIndex;
       }

       function _getCardOffsetFromCardIndex(index) {
         // starting offset width
         //var offsetOriginX = (carouselCardSpacerWidth * (index)) + (index * cardWidth);

         var offsetOriginX = (index * (cardWidthWithDivider)); /*- ((elementWidth - (cardWidthWithDivider)) / 2) + carouselCardSpacerWidth + 4*index;*/

         return Math.ceil(offsetOriginX);
       }


       function _scrollView(x) {
         //var adjustedX = 0;
         if (angular.isDefined(x)) {
           //currentViewOffset.x = (x > maxViewOffset.x) ? maxViewOffset.x : (x < minViewOffset.x) ? minViewOffset.x : x;
           //adjustedX  = (x > maxViewOffset.x) ? maxViewOffset.x : (x < minViewOffset.x) ? minViewOffset.x : x;
           currentViewOffset.x = x;
           carouselView.css({'transform': 'translateX(' + (- currentViewOffset.x) +  'px)'});
         }


         scrollBarIndicator.css({'transform': 'translateX(' + ((elementWidth - scrollBarIndicatorWidth) * (currentViewOffset.x / (maxViewOffset.x - scrollBarIndicatorWidth)) + Math.round(scope.cardDeck.selectedCardIndex * 5.00))  +  'px)'});
       }


       function _autoScroll() {

         if (amplitude === 0) {
           return;
         }

         var elapsedTime = Date.now() - frameTimeStamp;
         var delta = -amplitude * Math.exp(-elapsedTime / Tau);  // - Amplitude * e^(-t/T), T (Tau) is constant

         if (Math.abs(delta) > 0.5) {  // of the amplitude hasn't decayed too much then do another animation frame
           _scrollView(targetOffset.x + delta); // y(t) = y' - Amplitude * e^(-t/T), y' is the final rest position, t is the time
           requestAnimationFrame(_autoScroll); // request another animation frame from the browser
         }
         else {
           _scrollView(targetOffset.x); // otherwise finish off the animation at the final y'
           scope.$apply(function() { scope.updateSelectedIndex(_getCardIndexBasedOffOffset()); });
           setTimeout(function() { scrollBarIndicator.fadeOut('fast'); }, 500);

         }

       }


       function _reset() {

         isTouchInProgress = false;

         if (ticker !== null) {
           clearInterval(ticker);
           ticker = null;
         }

         //console.log('End velocity : ',dx,velocityOfSwipe.x);
         if (Math.abs(dx) > 2 && Math.abs(velocityOfSwipe.x) > 5) {

           _resetTau();
           velocityOfSwipe.x = Math.min(velocityOfSwipe.x, elementWidth);
           //amplitude = 0.8 * velocityOfSwipe.x;

           frameTimeStamp = Date.now();
           var tempProposedOffset = Math.round(currentViewOffset.x + (0.8 * velocityOfSwipe.x));
           var proposedOffset = (tempProposedOffset > (maxViewOffset.x)) ? (maxViewOffset.x) : (tempProposedOffset < (minViewOffset.x)) ? (minViewOffset.x) : tempProposedOffset;


           if (proposedOffset !== tempProposedOffset) {
             Tau = Tau / 2; // decay in half the time
           }


           var cardIndex = _getCardIndexBasedOffOffset(proposedOffset);
           var adjustedOffset =  _getCardOffsetFromCardIndex(cardIndex);
           amplitude = adjustedOffset - currentViewOffset.x;
           //console.log('velocity: ' + velocityOfSwipe.x, ' amplitude: ' + amplitude);


           targetOffset.x = adjustedOffset;
           requestAnimationFrame(_autoScroll);
         }



       }



       function _trackInstantaneousVelocity() {
         var nowTime, elapsedTime;
         var velocity = {x: 0, y: 0};
         var deltaOffset = {x: 0, y: 0};

         nowTime = Date.now();
         elapsedTime = nowTime - frameTimeStamp;
         frameTimeStamp = nowTime;
         deltaOffset.x = currentViewOffset.x - currentFrameOffset.x;
         currentFrameOffset.x = currentViewOffset.x;

         velocity.x = 1000 * deltaOffset.x / (1 + elapsedTime); // current velocity if measured over a second (1000 milliseconds)
         velocityOfSwipe.x = 0.8  * velocity.x + 0.2 * velocityOfSwipe.x;  // factor in 80% of current X velocity and 20% of the previous velocity calc

       }

       function _startTouch(event) {
         _initVars();

         startX = event.x;
         startY = event.y;
         isTouchInProgress = true;

         frameTimeStamp = Date.now();
         scrollBarIndicator.fadeIn('fast');

         if (ticker !== null) {
           clearInterval(ticker);
         }

         ticker = setInterval(_trackInstantaneousVelocity, 66); // refresh of ~ 15 times/second

       }



       // touch reliant scope functions
       scope.goToCard = function(index, buttonPressed) {

         if (cardWidth === 0) {
           cardWidth = scope.getCardWidth();
           cardWidthWithDivider = cardWidth + carouselCardSpacerWidth;
         }

         if (! angular.isDefined(buttonPressed)) {
           _scrollView(_getCardOffsetFromCardIndex(index));
           scope.updateSelectedIndex(index);
         }
         else {
           _resetTau();
           scope.updateSelectedIndex(index);
           var proposedOffset = _getCardOffsetFromCardIndex(index);
           velocityOfSwipe.x = proposedOffset - currentViewOffset.x;
           amplitude = 0.8 * velocityOfSwipe.x;
           frameTimeStamp = Date.now();
           targetOffset.x = proposedOffset;
           requestAnimationFrame(_autoScroll);
         }

       };

       // init the other variables mentioned above...
       _initVars();

       return {
         start: function(event) {
           _startTouch(event);
           //console.log('start', event);
         },

         move: function(event) {
           var currentX = event.x;

           if (! isTouchInProgress) {
             return;
           }

           dx = startX - currentX;

           if (Math.abs(dx) > 2) {
             startX = currentX;
             _scrollView(currentViewOffset.x + dx);
           }




           //console.log('move', event);

         },

         end: function() {
           //console.log('end', event);
           _reset();
         },

         cancel: function() {
           _reset();
         }
       };
     }
     //////////////////////////////////


     // Pre init the app if we are expecting a specific amount of cards
     if (criticalCardCount !== 0) {
       _init();
     }



     // Watchers.....
     scope.$watch(function() { return scope.getCardWidth(); }, function(newWidth, oldWidth) {
       if (! angular.isNumber(newWidth) || newWidth === oldWidth || newWidth < 1) {
         return;
       }

       // recalculate the appropriate math
       _init();

       // move to the first card in the deck
       scope.goToCard(0,  true);
     });

     scope.$watch(function() { return scope.cardDeck.cards.length; }, function(newLength, oldLength) {

       // if there is any card in the stack and its the first run initialize the UI
       if (oldLength === 0 && newLength > 0 || (isFirstRun && newLength > 0)) {
         scope.goToCard(0);
         isFirstRun = false;
       }

       // if there an expected count and that count is reached fire an event...
       if (criticalCardCount > 0 && newLength === criticalCardCount) {
         _recalcElementHeight();
         scope.$emit(kCarouselEvents.CARD_COUNT_REACHED_EVENT, {width: scope.getCardWidth(), height: scope.getCardHeight()});
         criticalCardCount = 0;
         _init();
       }

       console.log('New card length = ' + newLength);

       _recalculateScrollBarWidth();

     });

     $swipe.bind(carouselView, _touchHandler());


   }
     };
 });
