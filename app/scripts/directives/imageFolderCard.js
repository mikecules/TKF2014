// Written by Michael Moncada
// Code and CSS Adopted from 3D Thumbnail Hover Effects
// http://tympanus.net/codrops/2012/06/18/3d-thumbnail-hover-effects/

'use strict';

angular.module('tkf2014App')
  .directive('imageFolderCard', function() {
    return {
      restrict: 'A',
      scope: {
        carouselCard: '@imageFolderCard',
        cardWidth: '@',
        cardHeight: '@',
        img: '@',
        animationType: '@'
      },
      //replace: true,
      transclude: true,
      //template: '<div data-ng-transclude=""></div>',
      templateUrl: 'views/imageFolderCard.html',
      require: '^kineticScroller',
      link: function(scope, element, attrs, kineticScroller) {

        var _isOpen = false;

        // push this card onto the card stack
        kineticScroller.pushCard(element);

        // set some defaults for height and width if it doesn't exist...
        scope.cardHeight = scope.cardHeight || '220px';
        scope.cardWidth = scope.cardWidth || '300px';
        scope.animationType = scope.animationType || 'fold';

        element
          .addClass('view navigation-carousel-card animated-object ' + scope.animationType)
          .css({'height': scope.cardHeight, 'width': scope.cardWidth})
          .after('<div class="carousel-spacer"></div>')
          .find('.slice')
            .css({'backgroundImage': 'url(' + scope.img + ')'});


        scope.toggleFold = function() {
          _isOpen = ! _isOpen;

          if (_isOpen) {
            element.addClass('selected');
          }
          else {
            element.removeClass('selected');
          }
        };

        scope.$watch(function() { return scope.cardWidth; }, function(cardWidth) {

          var adjustedCardWidth = parseInt(cardWidth, 10) - 5 /* number of vertical divs */;

          if (angular.isDefined(adjustedCardWidth) && adjustedCardWidth > 0) {
            element.width(adjustedCardWidth);
            //console.log('width: ' + cardWidth + ' ' + element.width() );
            kineticScroller.setMaxCardWidth(adjustedCardWidth);

          }
        });

      }
    };
  });
