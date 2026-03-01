
import { MapPin, Shield, XCircle, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import api from '@/services/api';
import { useDAP } from '@/contexts/DAPContext';

const getLogIcon = (type: string) => {
  switch (type) {
    case 'access':
      return { icon: Shield, color: 'text-accent', bg: 'bg-accent/10' };
    case 'create':
      return { icon: MapPin, color: 'text-success', bg: 'bg-success/10' };
    case 'revoke':
      return { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' };
    case 'deny':
      return { icon: XCircle, color: 'text-warning', bg: 'bg-warning/10' };
    case 'approve':
    case 'verify':
      return { icon: CheckCircle2, color: 'text-status-gold', bg: 'bg-status-gold/10' };
    default:
      return { icon: Shield, color: 'text-muted-foreground', bg: 'bg-muted' };
  }
};

const getSeverityStyles = (severity: string) => {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' };
    case 'WARNING':
      return { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' };
    default:
      return { icon: Info, color: 'text-primary', bg: 'bg-primary/10' };
  }
};


export default function ActivityLogs() {
  const { token } = useDAP();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.activityLogs.fetch(token)
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load activity logs');
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          Immutable audit trail of all security and data activities
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {loading && <div>Loading...</div>}
        {error && <div className="text-destructive">{error}</div>}
        {!loading && !error && logs.length === 0 && <div>No activity logs found.</div>}
        {!loading && !error && logs.map((log, index) => {
          const { icon: ActionIcon, color: actionColor, bg: actionBg } = getLogIcon(log.action);
          const { icon: SeverityIcon, color: severityColor, bg: severityBg } = getSeverityStyles(log.severity);
          const isExpanded = expandedLogId === log.id;

          return (
            <Card key={log.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", actionBg)}>
                    <ActionIcon className={cn("h-5 w-5", actionColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 cursor-pointer" onClick={() => toggleExpand(log.id)}>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground capitalize">{log.action}</h4>
                        {log.severity && (
                          <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1", severityBg, severityColor)}>
                            <SeverityIcon className="w-3 h-3" />
                            {log.severity}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{log.description}</p>

                    {/* Expanded Audit Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                        <div>
                          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Network & Device</p>
                          <div className="bg-muted/50 p-2 rounded-md space-y-1">
                            <p><span className="text-muted-foreground">IP Address:</span> <span className="font-mono text-xs">{log.ip_address || 'N/A'}</span></p>
                            <p className="truncate" title={log.user_agent}><span className="text-muted-foreground">User Agent:</span> <span className="font-mono text-[10px]">{log.user_agent || 'N/A'}</span></p>
                          </div>
                        </div>

                        <div>
                          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Payload</p>
                          <div className="bg-muted/50 p-2 rounded-md overflow-x-auto">
                            {log.payload ? (
                              <pre className="font-mono text-[10px] text-foreground">
                                {(() => {
                                  try {
                                    return JSON.stringify(JSON.parse(log.payload), null, 2);
                                  } catch {
                                    return log.payload;
                                  }
                                })()}
                              </pre>
                            ) : (
                              <p className="text-muted-foreground italic text-xs">No payload captured</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
