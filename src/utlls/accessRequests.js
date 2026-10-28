import axios from 'axios';
import { config } from './config';
import catalog from '../config/accessCatalog.generated.json';
import { accessSnapshot, canUseField } from './accessCapabilities';
function formAccessError(message) {
  return Object.assign(new Error(message), { code: 'ACCESS_FORM_PERMISSION', response: { status: 403, data: { message } } });
}

export function accessMutationRoute(request) {
  const url = new URL(request.url, request.baseURL || config.BASE_URL);
  if (url.origin !== new URL(config.BASE_URL).origin) return null;
  const method = (request.method || 'get').toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return null;
  return catalog.routes.find((route) => !route.public && !route.blocked && route.method === method &&
    new RegExp(`^${route.path.split('/').map((part) => part.startsWith(':') ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/')}/?$`).test(url.pathname));
}
export function permittedRequestBody(body, route) {
  const access = accessSnapshot();
  if (!route || body == null) return body;
  const form = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!form && (typeof body !== 'object' || Array.isArray(body))) throw formAccessError('Unsupported form payload');
  const result = form ? new FormData() : {};
  // The API authorizes Add User role choices through assignment permission, not field grants.
  const assignment = route.handler === 'addUser' ? ['accessRoleId', 'accessBatchIds', 'accessCourseIds'] : [];
  for (const [key, value] of form ? body.entries() : Object.entries(body)) {
    if (!assignment.includes(key) && (catalog.readOnlyFields?.includes(key) || (access.managed && !access.owner && !canUseField(key, 'write', true)))) {
      const payment = route.handler === 'addStudent' && key === 'paying_now' && Number(value) > 0;
      const destination = ['addStudent', 'transferStudentBatch'].includes(route.handler) && key === 'batch' && value;
      const assignmentInput = ['assignCoursesToBatch', 'assignTeachersToBatch', 'assignTeacherCoursesToBatch'].includes(route.handler) && ['batchId', 'courseIds', 'teacherIds', 'assignments'].includes(key);
      const importRows = route.handler === 'bulkImportStudents' && ['batch_id', 'students'].includes(key);
      const status = ['toggleStudentStatus', 'toggleBatchStudentsStatus', 'toggleBatchStatus'].includes(route.handler) && key === 'is_active';
      if (payment || destination || assignmentInput || importRows || status) throw formAccessError(`This workflow needs permission to write ${key.replace(/_/g, ' ')}. Ask the owner to add the required workflow access. Nothing was submitted.`);
      continue;
    }
    if (form) result.append(key, value); else result[key] = value;
  }
  const size = form ? [...result.keys()].length : Object.keys(result).length;
  if (/update|edit|basicStudentUpdate/i.test(route.handler) && !size) throw formAccessError('You do not have access to edit any of the submitted fields. Your changes have not been saved.');
  return result;
}
let installed = false;
export async function accessFetch(input, options = {}) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : null;
  if (!url) return globalThis.fetch(input, options);
  const route = accessMutationRoute({ url, method: options.method });
  if (!route || options.body == null) return globalThis.fetch(input, options);
  const json = typeof options.body === 'string';
  let body = options.body;
  if (json) {
    try { body = JSON.parse(body); } catch { throw formAccessError('Invalid JSON form payload'); }
  }
  body = permittedRequestBody(body, route);
  return globalThis.fetch(input, { ...options, body: json ? JSON.stringify(body) : body });
}
export function setupAccessRequestInterceptor() {
  if (installed) return;
  installed = true;
  axios.interceptors.request.use((request) => {
    const route = accessMutationRoute(request);
    request.data = permittedRequestBody(request.data, route);
    return request;
  });
}
