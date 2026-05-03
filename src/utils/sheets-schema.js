export const CHORES_RANGE = 'Chores!A2:D';
export const BOOKINGS_RANGE = 'Bookings!A2:J';
export const SUMS_RANGE = 'Sums!A2:B';
export const SETTINGS_RANGE = 'Settings!A2:B';
export const USERS_RANGE = 'Users!A2:C';
export const DEFAULT_SPREADSHEET_ID = '';

export const CHORE_ICONS = {
  siivous: 'cleaning',
  tiskaus: 'dishes',
  ruoanlaitto: 'cooking',
  pyykki: 'laundry',
  roskat: 'recycle',
  ruokaostokset: 'groceries',
  posti: 'mail',
  vauva: 'baby',
};

export const DEFAULT_CHORES = [
  { id: 'siivous', description: 'Siivous', value: 2, displayName: 'Siivous' },
  {
    id: 'tiskaus',
    description: 'Tiskaus ja koneen tyhjennys',
    value: 1.5,
    displayName: 'Tiskaus',
  },
  {
    id: 'ruoanlaitto',
    description: 'Ruoanlaitto',
    value: 2,
    displayName: 'Ruoanlaitto',
  },
  {
    id: 'pyykki',
    description: 'Pykinpesu ja viikkaus',
    value: 1.5,
    displayName: 'Pyykki',
  },
  {
    id: 'roskat',
    description: 'Roskien vienti',
    value: 0.5,
    displayName: 'Roskat',
  },
  {
    id: 'ruokaostokset',
    description: 'Kauppaostokset',
    value: 1,
    displayName: 'Ruokaostokset',
  },
  {
    id: 'posti',
    description: 'Postin haku',
    value: 0.5,
    displayName: 'Posti',
  },
  {
    id: 'vauva',
    description: 'Vauvan hoito',
    value: 3,
    displayName: 'Vauva',
  },
];

export const CHORES_HEADERS = ['ID', 'Description', 'Value', 'DisplayName'];
export const BOOKINGS_HEADERS = [
  'Timestamp',
  'ChoreID',
  'Description',
  'Value',
  'WeekNumber',
  'UserName',
  'Status',
  'ApprovedBy',
  'ApprovedAt',
  'UserEmail',
];
export const SUMS_HEADERS = ['Type', 'Amount'];
export const USERS_HEADERS = ['Email', 'Name', 'Role'];
export const ROLES = { PARENT: 'parent', CHILD: 'child' };
