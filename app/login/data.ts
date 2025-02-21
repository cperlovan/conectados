interface User {
    username: string;
    role: string;
    authorized: boolean;
 
  }
  
  export const users: User[] = [
    { username: 'admin', password: 'password', role: 'admin', authorized: true },
    { username: 'user1', password: 'password', role: 'user', authorized: true },
    { username: 'user2', password: 'password', role: 'user', authorized: false },
  ];