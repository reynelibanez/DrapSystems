import { ViewClientProfile } from '../shared/ViewClientProfile';

interface ClientProfileProps {
  clientId: string;
}

export function ClientProfile({ clientId }: ClientProfileProps) {
  return <ViewClientProfile clientId={clientId} allowEdit={true} />;
}

