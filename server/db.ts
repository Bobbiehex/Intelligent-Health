import { PrismaClient } from '@prisma/client';

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.LOG_LEVEL === 'debug' 
      ? ['query', 'info', 'warn', { emit: 'event', level: 'error' }] 
      : [{ emit: 'event', level: 'error' }],
  });

  (client as any).$on('error', (e: any) => {
    const msg = String(e.message || e).toLowerCase();
    if (msg.includes('closed') || msg.includes('connection') || msg.includes('socket')) {
      // Suppress idle connection errors from being printed as raw errors
    } else {
      console.error('Prisma Error:', e.message || e);
    }
  });

  return client;
}

let prismaInstance = createPrismaClient();

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (typeof prop === 'symbol') {
      return Reflect.get(prismaInstance, prop);
    }

    const value = (prismaInstance as any)[prop];

    // Intercept top-level functions (like $transaction, $queryRaw, etc.)
    if (typeof value === 'function') {
      return async function (this: any, ...args: any[]) {
        try {
          return await value.apply(prismaInstance, args);
        } catch (error: any) {
          const errorMsg = (
            String(error?.message || '') + ' ' + 
            String(error?.stack || '') + ' ' + 
            String(error?.code || '') + ' ' + 
            String(error || '') + ' ' +
            JSON.stringify(error || {})
          ).toLowerCase();
          if (
            errorMsg.includes('closed') ||
            errorMsg.includes('connection') ||
            errorMsg.includes('socket') ||
            errorMsg.includes('socket hang up') ||
            errorMsg.includes('disconnect') ||
            errorMsg.includes('pool') ||
            error?.kind === 'Closed'
          ) {
            console.warn(`⚠️ Connection error on top-level method "${String(prop)}". Re-creating client and retrying in 1.5s...`);
            try {
              await prismaInstance.$disconnect().catch(() => {});
            } catch (e) {}

            await new Promise(resolve => setTimeout(resolve, 1500));

            prismaInstance = createPrismaClient();

            const freshMethod = (prismaInstance as any)[prop];
            return await freshMethod.apply(prismaInstance, args);
          }
          throw error;
        }
      };
    }

    // Intercept model delegates (like prisma.user, prisma.appointment)
    if (value !== null && typeof value === 'object') {
      return new Proxy(value, {
        get(modelTarget, modelProp) {
          if (typeof modelProp === 'symbol') {
            return Reflect.get(modelTarget, modelProp);
          }

          const modelValue = modelTarget[modelProp];

          if (typeof modelValue === 'function') {
            return async function (this: any, ...args: any[]) {
              try {
                // Execute using current client context
                const currentModel = (prismaInstance as any)[prop];
                const currentMethod = currentModel[modelProp];
                return await currentMethod.apply(currentModel, args);
              } catch (error: any) {
                const errorMsg = (
                  String(error?.message || '') + ' ' + 
                  String(error?.stack || '') + ' ' + 
                  String(error?.code || '') + ' ' + 
                  String(error || '') + ' ' +
                  JSON.stringify(error || {})
                ).toLowerCase();
                if (
                  errorMsg.includes('closed') ||
                  errorMsg.includes('connection') ||
                  errorMsg.includes('socket') ||
                  errorMsg.includes('socket hang up') ||
                  errorMsg.includes('disconnect') ||
                  errorMsg.includes('pool') ||
                  error?.kind === 'Closed'
                ) {
                  console.warn(`⚠️ Connection error on model "${String(prop)}" method "${String(modelProp)}". Re-creating client and retrying in 1.5s...`);
                  try {
                    await prismaInstance.$disconnect().catch(() => {});
                  } catch (e) {}

                  await new Promise(resolve => setTimeout(resolve, 1500));

                  prismaInstance = createPrismaClient();

                  // Execute on the new client model
                  const freshModel = (prismaInstance as any)[prop];
                  const freshMethod = freshModel[modelProp];
                  return await freshMethod.apply(freshModel, args);
                }
                throw error;
              }
            };
          }

          return modelValue;
        }
      });
    }

    return value;
  }
});

/**
 * Checks if we can establish a connection with the database.
 * Returns true if successful, false otherwise.
 */
export async function testDbConnection(retries = 5, delay = 2000): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('✅ Connected to PostgreSQL database via Prisma.');
      return true;
    } catch (error: any) {
      const isLastRetry = i === retries - 1;
      const errorMsg = String(error?.message || error).toLowerCase();
      
      console.warn(`⚠️ Database Connection Attempt ${i + 1} failed: ${errorMsg}`);
      
      if (isLastRetry) {
        console.error('❌ Database Connection Final Failure: Failed to connect via Prisma after multiple retries. Please check your DATABASE_URL environment secret.');
        console.error(error?.message || error);
        return false;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

