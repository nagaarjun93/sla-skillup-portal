import { useNavigation, useRoute } from '@react-navigation/native';

export function useLocalSearchParams() {
  try {
    const route = useRoute();
    return (route && route.params) ? route.params : {};
  } catch (e) {
    return {};
  }
}

export function useUniversalRouter() {
  let navigation = null;
  let routeParams = {};

  try {
    navigation = useNavigation();
  } catch (e) {
    // Fallback if not inside NavigationContainer
  }

  try {
    const route = useRoute();
    if (route && route.params) {
      routeParams = { ...route.params };
    }
  } catch (e) {
    // Fallback
  }

  // Web query param support (e.g. ?id=123&isMock=true)
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const queryObj = Object.fromEntries(urlParams.entries());
      routeParams = { ...queryObj, ...routeParams };
    } catch (e) {
      // ignore
    }
  }

  const parseRoute = (routeInput, extraParams) => {
    let routeName = '';
    let params = extraParams || {};

    if (typeof routeInput === 'string') {
      routeName = routeInput.replace(/^\//, '');
    } else if (routeInput && typeof routeInput === 'object') {
      const rawTarget = routeInput.name || routeInput.pathname || routeInput.screen;
      if (typeof rawTarget === 'string') {
        routeName = rawTarget.replace(/^\//, '');
      }
      if (routeInput.params && typeof routeInput.params === 'object') {
        params = { ...routeInput.params, ...extraParams };
      }
    }

    return { routeName, params };
  };

  return {
    push: (routeInput, extraParams) => {
      if (navigation) {
        const { routeName, params } = parseRoute(routeInput, extraParams);
        if (!routeName) {
          console.warn('[useUniversalRouter] Invalid navigation call, routeName is missing:', routeInput);
          return;
        }
        navigation.navigate(routeName, params);
      }
    },
    replace: (routeInput, extraParams) => {
      if (navigation) {
        const { routeName, params } = parseRoute(routeInput, extraParams);
        if (!routeName) {
          console.warn('[useUniversalRouter] Invalid navigation replace call, routeName is missing:', routeInput);
          return;
        }
        try {
          navigation.replace(routeName, params);
        } catch (e) {
          navigation.navigate(routeName, params);
        }
      }
    },
    navigate: (routeInput, extraParams) => {
      if (navigation) {
        const { routeName, params } = parseRoute(routeInput, extraParams);
        if (!routeName) {
          console.warn('[useUniversalRouter] Invalid navigation navigate call, routeName is missing:', routeInput);
          return;
        }
        navigation.navigate(routeName, params);
      }
    },
    back: (fallbackRoute) => {
      if (navigation && navigation.canGoBack()) {
        navigation.goBack();
      } else if (navigation) {
        // Safe intelligent fallback so pressing back NEVER freezes or fails
        const target = fallbackRoute || 'home';
        const { routeName, params } = parseRoute(target);
        navigation.navigate(routeName || 'home', params);
      }
    },
    canGoBack: () => {
      return navigation ? navigation.canGoBack() : false;
    },
    params: routeParams,
  };
}
