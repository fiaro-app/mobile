import { compareVersions, isUpdateRequired, MobileVersionSchema } from '@/features/system/lib/version';

const remote = {
  minimumSupportedVersion: '1.2.0',
  latestVersion: '1.4.0',
  downloadUrl: 'https://fiaro.co/app.apk',
};

describe('compareVersions', () => {
  it.each([
    ['1.0.0', '1.0.0', 0],
    ['1.0.1', '1.0.0', 1],
    ['1.9.0', '1.10.0', -1],
    ['2.0.0', '1.99.99', 1],
  ])('%s vs %s', (a, b, sign) => {
    expect(Math.sign(compareVersions(a, b))).toBe(sign);
  });
});

describe('isUpdateRequired', () => {
  it('exige actualizar por debajo de la mínima', () => {
    expect(isUpdateRequired('1.1.9', remote)).toBe(true);
  });

  it('permite la mínima y las posteriores', () => {
    expect(isUpdateRequired('1.2.0', remote)).toBe(false);
    expect(isUpdateRequired('1.5.0', remote)).toBe(false);
  });
});

describe('MobileVersionSchema', () => {
  it('rechaza una versión mal formada', () => {
    expect(MobileVersionSchema.safeParse({ ...remote, latestVersion: '1.4' }).success).toBe(false);
  });
});
