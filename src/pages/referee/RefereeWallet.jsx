import { RefereeLayout } from './RefereeLayout'
import WalletPanel from '@/components/wallet/WalletPanel'
import RefereeSalaryPanel from '@/components/referee/RefereeSalaryPanel'

export function RefereeWallet() {
  return (
    <RefereeLayout
      title="Ví của tôi · Trọng tài"
      subtitle="Nhận tiền lương định kỳ và phụ cấp công tác từ hệ thống"
    >
      <RefereeSalaryPanel />
      <WalletPanel
        walletMode="user"
        title="Ví trọng tài"
        description="Nhận lương từ hệ thống và phụ cấp theo từng giải đấu được phân công."
      />
    </RefereeLayout>
  )
}
