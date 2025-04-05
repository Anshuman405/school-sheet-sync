
import { ReactNode } from 'react';
import { 
  createClient,
  LiveList,
  LiveMap,
  LiveObject
} from '@liveblocks/client';
import { 
  RoomProvider,
  createRoomContext
} from '@liveblocks/react';

// Create the client
const client = createClient({
  publicApiKey: "pk_dev_HWQnH-l1PNo-zAlyqmz7dk8aYMbLp6EhK_7XyaY73HbWLJEVGqutnIweVlBgk5LV",
  throttle: 100,
});

// Create a type that represents Liveblocks' presence data
type Presence = {
  firstName?: string;
  lastName?: string;
  cursor: { x: number; y: number } | null;
};

// Create a type that represents the shared storage for our spreadsheet
type Storage = {
  sheets: LiveMap<string, LiveObject<{
    name: string;
    data: LiveList<LiveList<string>>;
    columns: number;
    rows: number;
  }>>;
};

// Create room context for using Liveblocks
export const {
  RoomProvider: LiveblocksRoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useSelf,
  useStorage,
  useMutation,
} = createRoomContext<Presence, Storage>(client);

interface LiveblocksProviderProps {
  children: ReactNode;
}

export const LiveblocksProvider = ({ children }: LiveblocksProviderProps) => {
  return children;
};
