const API_MESSAGE_VI = {
  'Current password is incorrect': 'Mật khẩu hiện tại không đúng',
  'New password must be different from current password':
    'Mật khẩu mới phải khác mật khẩu hiện tại',
  'Password login is not enabled for this account':
    'Tài khoản này không hỗ trợ đăng nhập bằng mật khẩu',
  'Current password is required': 'Vui lòng nhập mật khẩu hiện tại',
  'New password is required': 'Vui lòng nhập mật khẩu mới',
  'New password must be at least 6 characters': 'Mật khẩu mới phải có ít nhất 6 ký tự',
  'Password is required': 'Vui lòng nhập mật khẩu',
  'Password must be at least 6 characters': 'Mật khẩu phải có ít nhất 6 ký tự',
  'Invalid email or password': 'Email hoặc mật khẩu không đúng',
  'Validation failed': 'Dữ liệu không hợp lệ',
  'Invalid request body': 'Dữ liệu gửi lên không hợp lệ',
  'Access denied': 'Bạn không có quyền thực hiện thao tác này',
  'Authentication is required': 'Vui lòng đăng nhập để tiếp tục',
  'Internal server error': 'Máy chủ đang gặp sự cố. Thử lại sau.',
  'Database operation failed': 'Lỗi cơ sở dữ liệu. Thử lại sau.',
  'User profile request is required': 'Vui lòng nhập thông tin hồ sơ',
}

function isLoginRequest(error) {
  const url = String(error?.config?.url ?? '')
  return url.includes('/auth/login')
}

function isAccountLockedMessage(message) {
  const text = String(message ?? '').toLowerCase()
  return /khóa|locked|disabled|bị khóa/.test(text)
}

function translateApiMessage(message) {
  const text = String(message ?? '').trim()
  if (!text) return ''
  if (API_MESSAGE_VI[text]) return API_MESSAGE_VI[text]
  if (/[\u00C0-\u1EF9]/u.test(text)) return text
  return text
}

/** Thông báo lỗi từ BE — options.scene: 'login' | 'register' */
export function getApiErrorMessage(error, options = {}) {
  const status = error?.response?.status
  const data = error?.response?.data
  const message = String(data?.message ?? error?.message ?? '')
  const loginFlow = options.scene === 'login' || isLoginRequest(error)

  if (!error?.response) {
    if (loginFlow) return 'Không kết nối được máy chủ. Kiểm tra lại kết nối đến API.'
    return 'Không kết nối được máy chủ'
  }

  if (loginFlow) {
    if (status === 401) return 'Email hoặc mật khẩu không đúng'
    if (
      status === 403 ||
      isAccountLockedMessage(message) ||
      (status === 500 && /internal server/i.test(message))
    ) {
      return 'Tài khoản đã bị khóa. Liên hệ quản trị viên để được mở khóa.'
    }
    if (status >= 500) return 'Máy chủ đang gặp sự cố. Thử lại sau.'
  }

  if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    const fields = Object.values(data.data)
      .filter(Boolean)
      .map((item) => translateApiMessage(item))
    if (fields.length) return fields.join(', ')
  }

  return translateApiMessage(message) || 'Đã có lỗi xảy ra'
}
