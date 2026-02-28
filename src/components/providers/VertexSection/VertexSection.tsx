import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import iconVertex from '@/assets/icons/vertex.svg';
import type { ProviderKeyConfig } from '@/types';
import { maskApiKeyCompact } from '@/utils/format';
import type { KeyStats, UsageDetail } from '@/utils/usage';
import styles from '@/pages/AiProvidersPage.module.scss';
import usageStyles from '@/pages/UsagePage.module.scss';
import { getStatsBySource } from '../utils';

interface VertexSectionProps {
  configs: ProviderKeyConfig[];
  keyStats: KeyStats;
  usageDetails: UsageDetail[];
  loading: boolean;
  disableControls: boolean;
  isSwitching: boolean;
  onAdd: () => void;
  onAddInGroup?: () => void;
  onEditGroup?: (groupIndices: number[]) => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export function VertexSection({
  configs,
  keyStats,
  usageDetails: _usageDetails,
  loading,
  disableControls,
  isSwitching,
  onAdd,
  onAddInGroup,
  onEditGroup,
  onEdit,
  onDelete,
}: VertexSectionProps) {
  const { t } = useTranslation();
  const actionsDisabled = disableControls || loading || isSwitching;

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (baseUrlKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [baseUrlKey]: !prev[baseUrlKey],
    }));
  };

  return (
    <>
      <Card
        title={
          <span className={styles.cardTitle}>
            <img src={iconVertex} alt="" className={styles.cardTitleIcon} />
            {t('ai_providers.vertex_title')}
          </span>
        }
        extra={
          <Button size="sm" onClick={onAdd} disabled={actionsDisabled}>
            {t('ai_providers.vertex_add_button')}
          </Button>
        }
      >
        {loading && configs.length === 0 ? (
          <div className="hint">{t('common.loading')}</div>
        ) : configs.length === 0 ? (
          <EmptyState
            title={t('ai_providers.vertex_empty_title')}
            description={t('ai_providers.vertex_empty_desc')}
          />
        ) : (
          <div className={usageStyles.tableWrapper}>
            <table className={`${usageStyles.table} ${styles.providerTable}`}>
              <thead>
                <tr>
                  <th>{t('common.base_url')}</th>
                  <th>{t('ai_providers.claude_count')}</th>
                  <th>{t('ai_providers.claude_key')}</th>
                  <th>{t('stats.success')}</th>
                  <th>{t('stats.failure')}</th>
                  <th>{t('common.prefix')}</th>
                  <th>{t('common.actions', { defaultValue: 'Actions' })}</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const groupMap = new Map<
                    string,
                    {
                      baseUrl?: string;
                      items: { config: ProviderKeyConfig; index: number }[];
                      success: number;
                      failure: number;
                    }
                  >();

                  configs.forEach((config, index) => {
                    const baseUrlKey = config.baseUrl || '__default__';
                    const stats = getStatsBySource(config.apiKey, keyStats, config.prefix);
                    const existing = groupMap.get(baseUrlKey);
                    if (existing) {
                      existing.items.push({ config, index });
                      existing.success += stats.success;
                      existing.failure += stats.failure;
                    } else {
                      groupMap.set(baseUrlKey, {
                        baseUrl: config.baseUrl,
                        items: [{ config, index }],
                        success: stats.success,
                        failure: stats.failure,
                      });
                    }
                  });

                  const groups = Array.from(groupMap.values());

                  return groups.map((group) => {
                    const key = group.baseUrl || '__default__';
                    const isExpanded = !!expandedGroups[key];

                    return (
                      <Fragment key={key}>
                        <tr
                          className={styles.providerTableRowMerged}
                          onClick={() => toggleGroup(key)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            {group.baseUrl ||
                              t('ai_providers.default_base_url_label', {
                                defaultValue: 'Default (environment / global)',
                              })}
                          </td>
                          <td>{group.items.length}</td>
                          <td></td>
                          <td>{group.success}</td>
                          <td>{group.failure}</td>
                          <td></td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {onEditGroup && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditGroup(group.items.map((i) => i.index))}
                                  disabled={actionsDisabled}
                                >
                                  {t('common.edit')}
                                </Button>
                              )}
                              {onAddInGroup && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={onAddInGroup}
                                  disabled={actionsDisabled}
                                >
                                  {t('ai_providers.group_add_button', { defaultValue: 'Add' })}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded &&
                          group.items.map(({ config, index }) => {
                            const stats = getStatsBySource(
                              config.apiKey,
                              keyStats,
                              config.prefix
                            );
                            return (
                              <tr key={`${key}-${index}`} className={styles.providerTableRowChild}>
                                <td />
                                <td></td>
                                <td className={styles.providerTableKeyCell} title={config.apiKey}>
                                  {maskApiKeyCompact(config.apiKey)}
                                </td>
                                <td>{stats.success}</td>
                                <td>{stats.failure}</td>
                                <td>{config.prefix ?? ''}</td>
                                <td>
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
                                      variant="ghost" style={{ color: 'var(--danger-color, #ef4444)' }}
                                      size="sm"
                                      onClick={() => onDelete(index)}
                                      disabled={actionsDisabled}
                                    >
                                      {t('common.delete')}
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
