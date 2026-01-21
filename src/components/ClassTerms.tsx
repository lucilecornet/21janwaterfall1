'use client';

import { ShareClass, PreferenceType } from '@/types';

interface ClassTermsProps {
  classes: ShareClass[];
  onUpdateClass: (classId: string, updates: Partial<ShareClass>) => void;
  onRemoveClass: (classId: string) => void;
}

export function ClassTerms({
  classes,
  onUpdateClass,
  onRemoveClass,
}: ClassTermsProps) {
  const preferredClasses = classes.filter((c) => !c.isCommon);

  if (preferredClasses.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Share Class Terms</h2>
        <p className="text-sm text-gray-500">
          Add shareholders with preferred share classes to configure their terms.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Share Class Terms</h2>

      <div className="space-y-4">
        {preferredClasses
          .sort((a, b) => a.seniorityGroup - b.seniorityGroup)
          .map((cls) => (
            <div
              key={cls.id}
              className="bg-gray-50 rounded-lg p-4 space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cls.name}
                    onChange={(e) =>
                      onUpdateClass(cls.id, { name: e.target.value })
                    }
                    className="text-sm font-medium border-gray-300 rounded px-2 py-1 border focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                    Seniority: {cls.seniorityGroup + 1}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveClass(cls.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Preference Type
                  </label>
                  <select
                    value={cls.preferenceType}
                    onChange={(e) =>
                      onUpdateClass(cls.id, {
                        preferenceType: e.target.value as PreferenceType,
                      })
                    }
                    className="w-full text-sm border-gray-300 rounded px-2 py-1 border bg-white focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="non-participating">Non-participating</option>
                    <option value="participating">Participating</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Preference Multiple
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={cls.preferenceMultiple}
                      onChange={(e) =>
                        onUpdateClass(cls.id, {
                          preferenceMultiple: parseFloat(e.target.value) || 1,
                        })
                      }
                      className="w-20 text-sm text-right border-gray-300 rounded px-2 py-1 border focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-500">x</span>
                  </div>
                </div>

                {cls.preferenceType === 'participating' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Participation Cap
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={cls.participationCapMultiple || ''}
                        onChange={(e) =>
                          onUpdateClass(cls.id, {
                            participationCapMultiple: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="No cap"
                        className="w-20 text-sm text-right border-gray-300 rounded px-2 py-1 border focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">x</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Seniority Group
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cls.seniorityGroup}
                    onChange={(e) =>
                      onUpdateClass(cls.id, {
                        seniorityGroup: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-20 text-sm text-right border-gray-300 rounded px-2 py-1 border focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">
                    Lower = more senior
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>

      <p className="text-xs text-gray-500">
        Classes with the same seniority group are paid pari passu (pro rata
        within the group).
      </p>
    </div>
  );
}
