export interface Notifications {
  [key: string]: Notification;
}
export interface Notification {
  title: string;
  message: string;
  timestamp: number;
  icon: string;
  hyperlink_url: string;
  path: string;
}
