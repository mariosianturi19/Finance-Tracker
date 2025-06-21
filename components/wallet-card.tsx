// components/wallet-card.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getWalletTypeIcon, getWalletTypeLabel } from '@/lib/wallets';
import { formatCurrency } from '@/lib/utils';
import { WalletWithBalance, WalletType } from '@/lib/types';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';

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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ewallet':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'cash':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(wallet);
    }
  };

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
      } ${className}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getWalletTypeIcon(wallet.type)}</span>
            <div>
              <CardTitle className="text-lg">{wallet.name}</CardTitle>
              <Badge variant="outline" className={getTypeColor(wallet.type)}>
                {getWalletTypeLabel(wallet.type)}
              </Badge>
            </div>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(wallet);
                  }}
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
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Saldo Saat Ini</span>
          </div>
          <div className={`text-2xl font-bold ${
            wallet.current_balance >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {showBalance 
              ? formatCurrency(wallet.current_balance / 100)
              : '••••••••'
            }
          </div>
          <div className="text-xs text-muted-foreground">
            Saldo Awal: {formatCurrency(wallet.initial_balance / 100)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}