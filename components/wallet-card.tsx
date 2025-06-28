// components/wallet-card.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getWalletTypeIcon, getWalletTypeLabel } from '@/lib/wallets';
import { formatCurrency } from '@/lib/utils';
import { WalletWithBalance, WalletType } from '@/lib/types';
import { Edit, Trash2 } from 'lucide-react';

interface WalletCardProps {
  wallet: WalletWithBalance;
  showBalance?: boolean;
  onEdit?: (wallet: WalletWithBalance) => void;
  onDelete?: (wallet: WalletWithBalance) => void;
  onClick?: (wallet: WalletWithBalance) => void;
  className?: string;
}

export function WalletCard({ 
  wallet, 
  showBalance = true, 
  onEdit, 
  onDelete, 
  onClick,
  className = ""
}: WalletCardProps) {
  const getTypeColor = (type: WalletType) => {
    switch (type) {
      case 'bank':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
      case 'ewallet':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800';
      case 'cash':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800';
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(wallet);
    }
  };

  return (
    <Card 
      className={`border-0 shadow-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{getWalletTypeIcon(wallet.type)}</div>
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {wallet.name}
              </CardTitle>
              <Badge 
                variant="outline" 
                className={`text-xs ${getTypeColor(wallet.type)}`}
              >
                {getWalletTypeLabel(wallet.type)}
              </Badge>
            </div>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(wallet);
                  }}
                  className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(wallet);
                  }}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Saldo Saat Ini</span>
          <div className={`text-2xl font-bold ${
            wallet.current_balance >= 0 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {showBalance 
              ? formatCurrency(wallet.current_balance / 100)
              : '••••••••'
            }
          </div>
        </div>

        <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Saldo Awal</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {showBalance 
                ? formatCurrency(wallet.initial_balance / 100)
                : '••••••'
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
