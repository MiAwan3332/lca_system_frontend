import React, { createContext, useContext } from 'react';
const AccessFormContext = createContext(false);
export const useAccessForm = () => useContext(AccessFormContext);
const AccessForm = React.forwardRef(function AccessForm({ component: Component = 'form', permissionMode = 'edit', children, ...props }, ref) {
  return <AccessFormContext.Provider value={permissionMode}><Component ref={ref} {...props}>{children}</Component></AccessFormContext.Provider>;
});
export default AccessForm;
