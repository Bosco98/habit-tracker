'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Habit } from '@/types/habit';
import { normalizeHabitName, getDisplayName } from '@/lib/utils-habit';
import { Card } from '@/components/ui/card';

interface HabitManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habits: Habit[];
  onAddHabit: (habit: Habit) => void;
  onRemoveHabit: (id: string) => void;
  monthlyGoal: number;
  onSetGoal: (goal: number) => void;
}

export function HabitManagementModal({
  open,
  onOpenChange,
  habits,
  onAddHabit,
  onRemoveHabit,
  monthlyGoal,
  onSetGoal,
}: HabitManagementModalProps) {
  const [newHabitName, setNewHabitName] = useState('');
  const [goalInput, setGoalInput] = useState(monthlyGoal.toString());

  const handleAddHabit = () => {
    const name = newHabitName.trim();
    if (!name) {
      alert('Please enter a habit name.');
      return;
    }

    const isVice = name.startsWith('~');
    const normalizedNewName = normalizeHabitName(name);

    if (!normalizedNewName) {
      alert('Please enter a habit name.');
      return;
    }

    const hasDuplicate = habits.some(
      (h) => normalizeHabitName(h.name) === normalizedNewName
    );

    if (hasDuplicate) {
      alert('You already have a habit with that name.');
      return;
    }

    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      type: isVice ? 'vice' : 'health',
      xp: isVice ? -15 : 15,
    };

    onAddHabit(newHabit);
    setNewHabitName('');
  };

  const handleSetGoal = () => {
    const goalValue = parseInt(goalInput);
    if (isNaN(goalValue) || goalValue < 0) {
      alert('Please enter a valid non-negative number for the monthly goal.');
      return;
    }
    onSetGoal(goalValue);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            Habit Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-[10px] font-bold uppercase text-slate-400">
              Set Goal
            </h3>
            <div className="space-y-2">
              <Input
                type="number"
                min="0"
                placeholder="Monthly XP Goal"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
              />
              <Button onClick={handleSetGoal} className="w-full">
                Set Goal
              </Button>
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <h3 className="text-[10px] font-bold uppercase text-slate-400">
              Habit Management
            </h3>
            
            <Card className="border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
              <strong>Instructions:</strong>
              - Add `~` before a habit name to mark it as a vice.
              <br />
              - Completed habit will gain 15xp.
              <br />- Vices will deduct 15 XP.
            </Card>

            {/* Habit List */}
            <div className="space-y-2">
              {habits.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2"
                >
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[11px] font-bold text-slate-700">
                      {getDisplayName(h.name)}
                    </p>
                    {h.type === 'vice' && (
                      <Badge variant="destructive" className="text-[10px]">
                        Vice
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveHabit(h.id)}
                    className="h-6 px-2 text-red-400 hover:text-red-600"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>

            {/* Add Habit Form */}
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Habit name"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddHabit();
                  }
                }}
              />
              <Button onClick={handleAddHabit} className="w-full">
                Add Habit
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
