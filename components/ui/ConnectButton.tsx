"use client";

import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";

interface ConnectButtonProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ConnectButton({ className, size = "md" }: ConnectButtonProps) {
  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className={cn(
                      "btn-primary font-semibold transition-all",
                      size === "sm" && "px-4 py-2 text-sm",
                      size === "md" && "px-5 py-2.5 text-sm",
                      size === "lg" && "px-6 py-3 text-base w-full",
                      className
                    )}
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold rounded-xl border text-error border-error/30 bg-error/10 hover:bg-error/20 transition-all",
                      className
                    )}
                  >
                    Wrong Network
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-bg-secondary hover:border-border-hover text-sm font-medium transition-all"
                  >
                    {chain.hasIcon && chain.iconUrl && (
                      <img
                        alt={chain.name ?? "chain icon"}
                        src={chain.iconUrl}
                        className="w-4 h-4 rounded-full"
                      />
                    )}
                    <span className="text-text-secondary">{chain.name}</span>
                  </button>

                  <button
                    onClick={openAccountModal}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-bg-secondary hover:border-border-hover transition-all",
                      className
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-sm font-medium font-mono text-text-primary">
                      {account.displayName}
                    </span>
                    {account.displayBalance && (
                      <span className="text-sm text-text-secondary hidden sm:block">
                        {account.displayBalance}
                      </span>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
