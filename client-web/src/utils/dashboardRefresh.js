// client-web/src/utils/dashboardRefresh.js
// Event emitter để trigger dashboard refresh từ bất kỳ component nào

class DashboardRefreshEmitter {
  constructor() {
    this.listeners = [];
  }

  // Subscribe to refresh events
  on(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Trigger refresh event
  emit() {
    this.listeners.forEach(callback => callback());
  }
}

export const dashboardRefreshEmitter = new DashboardRefreshEmitter();

// Hook để sử dụng trong Dashboard component
export const useDashboardRefresh = (refreshFn) => {
  useEffect(() => {
    const unsubscribe = dashboardRefreshEmitter.on(() => {
      refreshFn();
    });
    return unsubscribe;
  }, [refreshFn]);
};
