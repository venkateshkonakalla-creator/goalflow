// src/components/AdGate.tsx
import RewardedAdModal from './RewardedAdModal'

interface AdGateProps {
  feature: string
  onComplete: () => void
  onClose: () => void
}

export default function AdGate(props: AdGateProps) {
  return <RewardedAdModal {...props} />
}

