import { fetchPlanPayments } from '@/features/plan/api/plan-api';
import { PLAN_COPY } from '@/features/plan/content/messages';
import { ADMIN_NAV } from '@/features/workspace/lib/admin-nav';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

describe('plan api', () => {
  it('reads the history from /subscription/payments and keeps only the items', async () => {
    jest.mocked(authedRequest).mockImplementation((_path: string, parse: (body: unknown) => unknown) => Promise.resolve(parse({ items: [{ reference: 'r', planCode: 'PRO', status: 'APPROVED', amountInCents: 1, createdAt: 'x', resolvedAt: null, periodEndsAt: null, paymentMethodType: null }] })) as never);

    const result = await fetchPlanPayments();

    expect(jest.mocked(authedRequest).mock.calls[0]?.[0]).toBe('/subscription/payments');
    expect(result).toHaveLength(1);
  });

  it('puts «Plan y pagos» in the admin menu', () => {
    expect(ADMIN_NAV.find((item) => item.key === 'plan')).toMatchObject({ href: '/admin/plan', label: PLAN_COPY.title });
  });
});
