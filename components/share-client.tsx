'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ShareRadarChart, ShareBarChart } from './share-charts';
import { Card, CardHeader, CardTitle, CardContent, StatsCardHeader } from './ui/card';
import { Button } from './ui/button';
import {
    ShareData,
    decompressShareData,
    compressShareData,
    processStats,
    getMotivationalQuote,
    captureSnapshot,
    shareSnapshot,
    triggerConfetti
} from '@/lib/share-utils';
import { storage } from '@/lib/storage';
import { Share2, Link as LinkIcon, Download } from 'lucide-react';

export function ShareClient() {
    const searchParams = useSearchParams();
    const [isCapturing, setIsCapturing] = useState(false);
    const [quote, setQuote] = useState('');
    const [mounted, setMounted] = useState(false);

    // Initialize data from URL or localStorage
    const shareData = useMemo((): ShareData => {
        const urlData = searchParams.get('data');
        if (urlData) {
            const decompressed = decompressShareData(urlData);
            if (decompressed) return decompressed;
        }

        const localLogs = storage.getLogs();
        const localHabits = storage.getHabits();
        const localSettings = storage.getSettings();

        return {
            logs: localLogs,
            template: localHabits,
            goal: localSettings.monthlyGoal,
        };
    }, [searchParams]);

    const stats = useMemo(() => processStats(shareData), [shareData]);
    const progress = useMemo(() =>
        shareData.goal > 0 ? Math.round((stats.totalXP / shareData.goal) * 100) : 0,
        [shareData.goal, stats.totalXP]
    );

    useEffect(() => {
        setMounted(true);
        setQuote(getMotivationalQuote(progress));
        triggerConfetti(stats.totalXP);
    }, [stats.totalXP, progress]);

    const handleCopyLink = () => {
        try {
            const compressed = compressShareData(shareData);
            const url = `${window.location.origin}${window.location.pathname}?data=${compressed}`;

            navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
        } catch {
            toast.error('Failed to copy link');
        }
    };

    const handleShareImage = async () => {
        setIsCapturing(true);
        const actionButtons = document.getElementById('action-buttons');
        if (actionButtons) {
            actionButtons.style.visibility = 'hidden';
        }

        try {
            await new Promise((r) => requestAnimationFrame(r));

            const dataUrl = await captureSnapshot('capture-area');

            if (actionButtons) {
                actionButtons.style.visibility = 'visible';
            }
            setIsCapturing(false);

            if (!dataUrl) {
                toast.error('Failed to capture image');
                return;
            }

            const success = await shareSnapshot(dataUrl, stats);
            if (success) {
                toast.success('Image shared successfully!');
            } else {
                toast.error('Failed to share image');
            }
        } catch {
            if (actionButtons) {
                actionButtons.style.visibility = 'visible';
            }
            setIsCapturing(false);
            toast.error('Export error');
        }
    };

    return (
        <>
            <div className="mx-auto max-w-4xl px-6 pb-0 pt-8">
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-8">
                        {mounted && (
                            <p className="text-center text-base italic leading-relaxed text-slate-600 md:text-lg">
                                &ldquo;{quote}&rdquo;
                            </p>
                        )}
                        {!mounted && (
                            <p className="text-center text-base italic leading-relaxed text-slate-600 md:text-lg">
                                &nbsp;
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div id="action-buttons" className="flex flex-wrap justify-center gap-4 py-4">
                <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="gap-2"
                >
                    <LinkIcon className="h-4 w-4" />
                    Copy Link
                </Button>

                <Button
                    onClick={handleShareImage}
                    disabled={isCapturing}

                >
                    {isCapturing ? (
                        <>
                            <Download className="h-4 w-4 animate-pulse" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <Share2 className="h-4 w-4" />
                            Share Image
                        </>
                    )}
                </Button>
            </div>

            <div className="min-h-screen px-6 pb-6 pt-2 md:px-12 md:pb-12 md:pt-4">
                {!mounted && (
                    <div className="flex min-h-[400px] items-center justify-center">
                        <p className="text-slate-500">Loading...</p>
                    </div>
                )}
                {mounted && (
                    <div
                        id="capture-area"
                        className={`mx-auto max-w-[900px] space-y-8 rounded-3xl bg-slate-50 p-4 md:p-8 ${isCapturing ? 'capturing' : ''}`}
                    >
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-4">
                            <Card className="md:col-span-1">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[10px] font-bold uppercase text-slate-400">
                                        XP Balance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black text-slate-800">
                                        {stats.totalXP.toLocaleString()}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="stat-card-main md:col-span-2 border-black-100 bg-gradient-to-b from-white to-slate-100">
                                <StatsCardHeader className="pb-2">
                                    Target Completion
                                </StatsCardHeader>
                                <CardContent>
                                    <div className="text-6xl font-black ">
                                        {progress}%
                                    </div>
                                    <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        {stats.totalXP} / {shareData.goal} UNITS
                                    </p>
                                    <div className="accent-line"></div>
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-1">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-center text-[10px] font-bold uppercase text-slate-400">
                                        Total Logs
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center text-2xl font-black text-slate-800">
                                        {stats.logCount}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                            <Card>
                                <StatsCardHeader>
                                    Progress Map
                                </StatsCardHeader>
                                <CardContent>
                                    <ShareRadarChart habits={shareData.template} stats={stats} goal={shareData.goal} />
                                </CardContent>
                            </Card>

                            <Card>
                                <StatsCardHeader >
                                    Daily Impact Distribution
                                </StatsCardHeader>
                                <CardContent>
                                    <ShareBarChart habits={shareData.template} stats={stats} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
