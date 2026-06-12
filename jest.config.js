module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/tests/component/**/*.test.tsx', '**/tests/component/**/*.test.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          jsx: 'react-jsx',
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^next/link$': '<rootDir>/src/lib/nextLinkMock.tsx',
    '^next/navigation$': '<rootDir>/src/lib/nextNavigationMock.tsx',
  },
};

