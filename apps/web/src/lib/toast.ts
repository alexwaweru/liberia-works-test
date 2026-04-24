import { toast as sonner } from 'sonner'

export const toast = {
  success: (...args: Parameters<typeof sonner.success>) => sonner.success(...args),
  error: (message: Parameters<typeof sonner.error>[0], options?: Parameters<typeof sonner.error>[1]) => {
    let id: string | number
    id = sonner.error(message, {
      duration: Infinity,
      action: { label: 'Close', onClick: () => sonner.dismiss(id) },
      ...options,
    })
    return id
  },
  info:    (...args: Parameters<typeof sonner.info>)    => sonner.info(...args),
  warning: (...args: Parameters<typeof sonner.warning>) => sonner.warning(...args),
  loading: (...args: Parameters<typeof sonner.loading>) => sonner.loading(...args),
  promise: (...args: Parameters<typeof sonner.promise>) => sonner.promise(...args),
  dismiss: (...args: Parameters<typeof sonner.dismiss>) => sonner.dismiss(...args),
}
