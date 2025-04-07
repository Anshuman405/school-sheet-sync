import { ReactNode } from 'react';
import { 
  createClient,
  LiveMap,
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
export type Presence = {
  firstName?: string;
  lastName?: string;
  cursor: { x: number; y: number } | null;
};

// Sheet object type
export type SheetData = {
  name: string;
  data: string[][]; // Use a 2D array for rows and cells
  columns: number;
  rows: number;
  updatedAt: string;
  starred?: boolean;
  shared?: boolean;
};

// Create a type that represents the shared storage for our spreadsheet
export type Storage = {
  sheets: LiveMap<string, SheetData>; // Use plain objects for sheets
};

// Create room context for using Liveblocks
export const {
  RoomProvider: LiveblocksRoomProvider,
  useRoom,
  useStorage,
  useOthers,
  useSelf,
  useMyPresence,
  useUpdateMyPresence,
  useMutation,
} = createRoomContext<Presence, Storage>(client);

// Default initial storage with empty sheets map
export const defaultInitialStorage: Storage = {
  sheets: new LiveMap()
};

interface LiveblocksProviderProps {
  children: ReactNode;
  roomId?: string;
  initialPresence?: Presence;
  initialStorage?: Storage;
}

export const LiveblocksProvider = ({ 
  children, 
  roomId = "default-room",
  initialPresence = {
    firstName: "",
    lastName: "",
    cursor: null
  },
  initialStorage = defaultInitialStorage
}: LiveblocksProviderProps) => {
  return (
    <LiveblocksRoomProvider
      id={roomId}
      initialPresence={initialPresence}
      initialStorage={initialStorage}
    >
      {children}
    </LiveblocksRoomProvider>
  );
};