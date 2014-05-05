'use strict';

angular.module('tkf2014App')
  .directive('imageFolderCard', function($timeout) {
    return {
      restrict: 'A',
      scope: {
        carouselCard: '@imageFolderCard',
        cardWidth: '@'
      },
      transclude: true,
      template: '<div data-ng-transclude=""></div>',
      //templateUrl: 'views/ui/navigationCarouselCard.html',
      require: '^kineticScroller',
      link: function(scope, element, attrs, acornNavigationCarouselWidget) {
        console.log(acornNavigationCarouselWidget);
        acornNavigationCarouselWidget.pushCard(element);
        element.addClass('navigation-carousel-card animated-object');
        element.after('<div class="carousel-spacer"></div>');
        scope.onInitFn = (angular.isFunction(scope.onInitFn)) ? scope.onInitFn : function() {};

        scope.$watch(function() { return scope.cardWidth; }, function(cardWidth) {

          if (angular.isDefined(cardWidth) && parseInt(cardWidth, 10) > 0) {
            element.width(cardWidth);
            //console.log('width: ' + cardWidth + ' ' + element.width() );
            acornNavigationCarouselWidget.setMaxCardWidth(element.width());

          }
        });

        if (angular.isFunction(scope.onInitFn)) {

          $timeout(function() { scope.onInitFn(element, attrs.cardIndex); }, 100);
        }
      }
    };
  });
