import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { EmptyState } from '@/components/ui/EmptyState';
import iconClaude from '@/assets/icons/claude.svg';
import type { ProviderKeyConfig } from '@/types';
import { maskApiKeyCompact } from '@/utils/format';
import type { KeyStats, UsageDetail } from '@/utils/usage';
import styles from '@/pages/AiProvidersPage.module.scss';
import usageStyles from '@/pages/UsagePage.module.scss';
import { getStatsBySource, hasDisableAllModelsRule } from '../utils';

interface ClaudeSectionProps {
  configs: ProviderKeyConfig[];
  keyStats: KeyStats;
  usageDetails: UsageDetail[];
  loading: boolean;
  disableControls: boolean;
  isSwitching: boolean;
  onAdd: () => void;
  onEdit: (index: number) => void;
  onEditKey?: (index: number) => void;
   // optional: add new child config under this provider
  onAddInGroup?: () => void;
  onEditGroup?: (groupIndices: number[]) => void;
  onDelete: (index: number) => void;
  onToggle: (index: number | number[], enabled: boolean) => void;
}

export function ClaudeSection({
  configs,
  keyStats,
  usageDetails: _usageDetails,
  loading,
  disableControls,
  isSwitching,
  onAdd,
  onEdit,
  onEditKey,
  onAddInGroup,
  onEditGroup,
  onDelete,
  onToggle,
}: ClaudeSectionProps) {
  const { t } = useTranslation();
  const actionsDisabled = disableControls || loading || isSwitching;
  const toggleDisabled = disableControls || loading || isSwitching;

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
            <img src={iconClaude} alt="" className={styles.cardTitleIcon} />
            {t('ai_providers.claude_title')}
          </span>
        }
        extra={
          <Button size="sm" onClick={onAdd} disabled={actionsDisabled}>
            {t('ai_providers.claude_add_button')}
          </Button>
        }
      >
        {loading && configs.length === 0 ? (
          <div className="hint">{t('common.loading')}</div>
        ) : configs.length === 0 ? (
          <EmptyState
            title={t('ai_providers.claude_empty_title')}
            description={t('ai_providers.claude_empty_desc')}
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
                  <th>{t('common.priority')}</th>
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
                    const groupIndices = group.items.map((item) => item.index);
                    const allDisabled = group.items.every(({ config }) =>
                      hasDisableAllModelsRule(config.excludedModels)
                    );

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
                          <td></td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                              <div style={{ display: 'flex', gap: 8 }}>
                                {onEditGroup && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEditGroup(groupIndices)}
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
                                    {t('ai_providers.group_add_button', {
                                      defaultValue: '新增',
                                    })}
                                  </Button>
                                )}
                              </div>
                              <ToggleSwitch
                                checked={!allDisabled}
                                disabled={toggleDisabled || group.items.length === 0}
                                onChange={(value) => onToggle(groupIndices, value)}
                              />
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
                            const configDisabled = hasDisableAllModelsRule(
                              config.excludedModels
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
                                <td>{config.priority ?? ''}</td>
                                <td>{config.prefix ?? ''}</td>
                                <td>
                                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          onEditKey ? onEditKey(index) : onEdit(index)
                                        }
                                        disabled={actionsDisabled}
                                      >
                                        {t('common.edit')}
                                      </Button>
                                      <Button
                                        variant="ghost" style={{ color: "var(--danger-color, #ef4444)" }}
                                        size="sm"
                                        onClick={() => onDelete(index)}
                                        disabled={actionsDisabled}
                                      >
                                        {t('common.delete')}
                                      </Button>
                                    </div>
                                    <ToggleSwitch
                                      checked={!configDisabled}
                                      disabled={toggleDisabled}
                                      onChange={(value) =>
                                        void onToggle(index, value)
                                      }
                                    />
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
