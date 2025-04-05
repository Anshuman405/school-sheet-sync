
import { ReactNode } from 'react';
import { 
  createClient
} from '@liveblocks/client';
import { 
  LiveblocksProvider as LiveblocksProviderComponent,
  RoomProvider
} from '@liveblocks/react';

const client = createClient({
  publicApiKey: "pk_dev_HWQnH-l1PNo-zAlyqmz7dk8aYMbLp6EhK_7XyaY73HbWLJEVGqutnIweVlBgk5LV",
  throttle: 100,
});

interface LiveblocksProviderProps {
  children: ReactNode;
}

export const LiveblocksProvider = ({ children }: LiveblocksProviderProps) => {
  return (
    <LiveblocksProviderComponent client={client}>
      {children}
    </LiveblocksProviderComponent>
  );
};
