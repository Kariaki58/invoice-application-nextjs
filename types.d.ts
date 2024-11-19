// types.d.ts or add to your existing type declaration file

declare global {
    namespace NodeJS {
      interface Global {
        mongoose: {
          conn: mongoose.Connection | null;
          promise: Promise<mongoose.Connection> | null;
        };
      }
    }
}
  
  // Ensure this file is treated as a module
  export {};
  