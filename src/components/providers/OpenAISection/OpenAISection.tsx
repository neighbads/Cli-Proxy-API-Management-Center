import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import iconOpenaiLight from '@/assets/icons/openai-light.svg';
import iconOpenaiDark from '@/assets/icons/openai-dark.svg';
import type { OpenAIProviderConfig } from '@/types';
import { maskApiKeyCompact } from '@/utils/format';
import type { KeyStats, UsageDetail } from '@/utils/usage';
import styles from '@/pages/AiProvidersPage.module.scss';
import usageStyles from '@/pages/UsagePage.module.scss';
import { getOpenAIProviderStats, getStatsBySource } from '../utils';

interface OpenAISectionProps {
  configs: OpenAIProviderConfig[];
  keyStats: KeyStats;
  usageDetails: UsageDetail[];
  loading: boolean;
  disableControls: boolean;
  isSwitching: boolean;
  resolvedTheme: string;
  onAdd: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export function OpenAISection({
  configs,
  keyStats,
  usageDetails: _usageDetails,
  loading,
  disableControls,
  isSwitching,
  resolvedTheme,
  onAdd,
  onEdit,
  onDelete,
}: OpenAISectionProps) {
  const { t } = useTranslation();
  const actionsDisabled = disableControls || loading || isSwitching;

  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});

  const toggleProvider = (name: string) => {
    setExpandedProviders((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <>
      <Card
        title={
          <span className={styles.cardTitle}>
            <img
              src={resolvedTheme === 'dark' ? iconOpenaiDark : iconOpenaiLight}
              alt=""
              className={styles.cardTitleIcon}
            />
            {t('ai_providers.openai_title')}
          </span>
        }
        extra={
          <Button size="sm" onClick={onAdd} disabled={actionsDisabled}>
            {t('ai_providers.openai_add_button')}
          </Button>
        }
      >
        {loading && configs.length === 0 ? (
          <div className="hint">{t('common.loading')}</div>
        ) : configs.length === 0 ? (
          <EmptyState
            title={t('ai_providers.openai_empty_title')}
            description={t('ai_providers.openai_empty_desc')}
          />
        ) : (
          <div className={usageStyles.tableWrapper}>
            <table className={`${usageStyles.table} ${styles.providerTable}`}>
              <thead>
                <tr>
                  <th>{t('ai_providers.openai_add_modal_name_label', { defaultValue: 'Name' })}</th>
                  <th>{t('common.base_url')}</th>
                  <th>{t('ai_providers.claude_count')}</th>
                  <th>{t('ai_providers.claude_key')}</th>
                  <th>{t('stats.success')}</th>
                  <th>{t('stats.failure')}</th>
                  <th>{t('common.priority')}</th>
                  <th>{t('common.prefix')}</th>
                  <th>{t('common.actions', { defaultValue: 'Actions' })}</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((provider, index) => {
                  const stats = getOpenAIProviderStats(provider.apiKeyEntries, keyStats, provider.prefix);
                  const isExpanded = !!expandedProviders[provider.name];
                  const apiKeyEntries = provider.apiKeyEntries || [];

                  return (
                    <Fragment key={`openai-${index}`}>
                      <tr
                        className={styles.providerTableRowMerged}
                        onClick={() => toggleProvider(provider.name)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{provider.name}</td>
                        <td>{provider.baseUrl}</td>
                        <td>{apiKeyEntries.length}</td>
                        <td></td>
                        <td>{stats.success}</td>
                        <td>{stats.failure}</td>
                        <td>{provider.priority ?? ''}</td>
                        <td>{provider.prefix ?? ''}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(index)}
                              disabled={actionsDisabled}
                            >
                              {t('common.edit')}
                            </Button>
                            <Button
                              variant="ghost"
                              style={{ color: 'var(--danger-color, #ef4444)' }}
                              size="sm"
                              onClick={() => onDelete(index)}
                              disabled={actionsDisabled}
                            >
                              {t('common.delete')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded &&
                        apiKeyEntries.map((entry, entryIndex) => {
                          const entryStats = getStatsBySource(entry.apiKey, keyStats);
                          return (
                            <tr
                              key={`openai-${index}-entry-${entryIndex}`}
                              className={styles.providerTableRowChild}
                            >
                              <td />
                              <td>{entry.proxyUrl ?? ''}</td>
                              <td></td>
                              <td className={styles.providerTableKeyCell} title={entry.apiKey}>
                                {maskApiKeyCompact(entry.apiKey)}
                              </td>
                              <td>{entryStats.success}</td>
                              <td>{entryStats.failure}</td>
                              <td></td>
                              <td></td>
                              <td></td>
                            </tr>
                          );
                        })}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
