import { Avatar } from "@/components/common/Avatar";
import { FriendCategoryTabs } from "@/components/friends/FriendCategoryTabs";
import { FriendRequestRow } from "@/components/friends/FriendRequestRow";
import { FriendRow } from "@/components/friends/FriendRow";
import { GroupInviteRow } from "@/components/friends/GroupInviteRow";
import { GroupRow } from "@/components/friends/GroupRow";
import { SearchUserRow } from "@/components/friends/SearchUserRow";
import { CallContext } from "@/context/CallContext";
import { friendApi } from "@/services/api/friend";
import { presenceSocketService } from "@/services/websocket/presenceSocket";
import type { CallType } from "@/types/call";
import type {
  BlockedFriendItem,
  FriendCategory,
  FriendItem,
  FriendRequestItem,
  GroupInviteItem,
  GroupItem,
  RecentlyActiveItem,
  SearchUserItem,
  SuggestedFriendItem,
} from "@/types/friend";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { GroupCallContext } from "@/context/GroupCallContext";
import { chatApi } from "@/services/api/chat";
import { useSlideMenu } from "@/context/SlideMenuContext";
import { Menu } from "lucide-react-native";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Friends() {
  const colors = useThemeColors();
  const router = useRouter();
  const { openMenu } = useSlideMenu();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ activeCategory?: string }>();
  const callContext = useContext(CallContext);
  const groupCallContext = useContext(GroupCallContext);
  const [activeCategory, setActiveCategory] =
    useState<FriendCategory>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [groupInvites, setGroupInvites] = useState<GroupInviteItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedFriendItem[]>([]);
  const [recentlyActive, setRecentlyActive] = useState<RecentlyActiveItem[]>(
    [],
  );
  const [blockedFriends, setBlockedFriends] = useState<BlockedFriendItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchUserItem[]>([]);
  const [pendingSentRequestIds, setPendingSentRequestIds] = useState<Set<string>>(
    new Set(),
  );

  // Handle deep-link activeCategory from notifications
  useEffect(() => {
    const nextCategory = params.activeCategory;
    if (
      nextCategory === "friends" ||
      nextCategory === "requests" ||
      nextCategory === "groups" ||
      nextCategory === "group_invites" ||
      nextCategory === "blocked"
    ) {
      setActiveCategory(nextCategory);
    }
  }, [params.activeCategory]);

  const formatAgo = (iso: string) => {
    const ms = Date.now() - new Date(iso).getTime();
    const mins = Math.max(1, Math.floor(ms / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const mapFriend = (item: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    isOnline: boolean;
  }): FriendItem => ({
    id: item.id,
    name: item.fullName,
    avatar: item.avatarUrl || undefined,
    isOnline: item.isOnline,
    subtext: item.isOnline ? "Online" : "Offline",
  });

  useEffect(() => {
    const bootstrap = async () => {
      const candidates = [
        await AsyncStorage.getItem("auth_user"),
        await AsyncStorage.getItem("user"),
        await AsyncStorage.getItem("current_user"),
      ].filter(Boolean) as string[];

      for (const raw of candidates) {
        try {
          const parsed = JSON.parse(raw);
          const id = parsed?.id || parsed?.userId;
          if (id) {
            setCurrentUserId(String(id));
            return;
          }
        } catch {
          continue;
        }
      }

      const fallbackId = await AsyncStorage.getItem("userId");
      if (fallbackId) {
        setCurrentUserId(fallbackId);
      }
    };

    void bootstrap();
  }, []);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!currentUserId) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        setErrorMessage(null);
        const [
          friendsRes,
          requestRes,
          outgoingRequestRes,
          groupsRes,
          groupInviteRes,
          suggestionRes,
          recentlyActiveRes,
          blockedRes,
        ] = await Promise.all([
          friendApi.getFriends(currentUserId),
          friendApi.getIncomingFriendRequests(currentUserId),
          friendApi.getOutgoingFriendRequests(currentUserId),
          friendApi.getMyGroups(currentUserId),
          friendApi.getIncomingGroupInvites(currentUserId),
          friendApi.getSuggestions(currentUserId),
          friendApi.getRecentlyActive(currentUserId),
          friendApi.getBlockedFriends(currentUserId),
        ]);

        setFriends(friendsRes.map(mapFriend));

        setRequests(
          requestRes.map((item) => ({
            id: item.requestId,
            senderId: item.sender.userId,
            receiverId: item.receiver.userId,
            name: item.sender.fullName,
            avatar: item.sender.avatarUrl,
            timeAgo: formatAgo(item.createdAt),
            status: item.status,
          })),
        );

        setPendingSentRequestIds(
          new Set(outgoingRequestRes.map((item) => item.receiver.userId)),
        );

        setGroups(groupsRes);
        setGroupInvites(groupInviteRes);
        setSuggestions(
          suggestionRes.map((item) => ({
            id: item.id,
            name: item.fullName,
            avatar: item.avatarUrl,
            mutualGroupCount: item.mutualGroupCount,
            mutualGroupNames: item.mutualGroupNames,
          })),
        );
        setRecentlyActive(
          recentlyActiveRes.map((item) => ({
            id: item.id,
            name: item.fullName,
            avatar: item.avatarUrl,
            isOnline: item.isOnline,
          })),
        );
        setBlockedFriends(
          blockedRes.map((item) => ({
            id: item.id,
            name: item.fullName,
            avatar: item.avatarUrl,
            blockedAt: item.blockedAt,
            isOnline: item.isOnline,
          })),
        );
      } catch (error) {
        console.error("Failed to load friend data", error);
        setErrorMessage("Cannot load friend data. Pull to refresh to retry.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    if (!currentUserId) return;
    void loadData(false);
  }, [currentUserId, loadData]);

  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        void loadData(true);
      }
      return undefined;
    }, [currentUserId, loadData]),
  );

  useEffect(() => {
    if (!currentUserId) return;

    const socket = presenceSocketService.connect(currentUserId);

    const onOnline = ({ userId }: { userId: string }) => {
      setFriends((prev) =>
        prev.map((item) =>
          item.id === userId
            ? { ...item, isOnline: true, subtext: "Online" }
            : item,
        ),
      );
      setRecentlyActive((prev) =>
        prev.map((item) =>
          item.id === userId ? { ...item, isOnline: true } : item,
        ),
      );
    };

    const onOffline = ({ userId }: { userId: string }) => {
      setFriends((prev) =>
        prev.map((item) =>
          item.id === userId
            ? { ...item, isOnline: false, subtext: "Offline" }
            : item,
        ),
      );
      setRecentlyActive((prev) =>
        prev.map((item) =>
          item.id === userId ? { ...item, isOnline: false } : item,
        ),
      );
    };

    const onOnlineList = ({ users }: { users: string[] }) => {
      const online = new Set(users);
      setFriends((prev) =>
        prev.map((item) => ({
          ...item,
          isOnline: online.has(item.id),
          subtext: online.has(item.id) ? "Online" : "Offline",
        })),
      );
    };

    socket.on("presence:user-online", onOnline);
    socket.on("presence:user-offline", onOffline);
    socket.on("presence:online-list", onOnlineList);
    socket.emit("presence:get-online");

    return () => {
      socket.off("presence:user-online", onOnline);
      socket.off("presence:user-offline", onOffline);
      socket.off("presence:online-list", onOnlineList);
      presenceSocketService.disconnect();
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const rows = await friendApi.searchUsers(currentUserId, trimmed);
        setSearchResults(rows);
      } catch (error) {
        console.error("Search users failed", error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUserId]);

  const filteredFriends = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const source = keyword
      ? friends.filter((item) => item.name.toLowerCase().includes(keyword))
      : friends;

    return [...source].sort((a, b) => Number(b.isOnline) - Number(a.isOnline));
  }, [friends, searchQuery]);

  const filteredSuggestions = useMemo(
    () =>
      suggestions.filter((item) => !pendingSentRequestIds.has(item.id)),
    [suggestions, pendingSentRequestIds],
  );

  const handleAccept = async (id: string) => {
    if (!currentUserId) return;
    await friendApi.acceptFriendRequest(id, currentUserId);
    setRequests((prev) => prev.filter((item) => item.id !== id));
    const refreshed = await friendApi.getFriends(currentUserId);
    setFriends(refreshed.map(mapFriend));
  };

  const handleDecline = async (id: string) => {
    if (!currentUserId) return;
    await friendApi.declineFriendRequest(id, currentUserId);
    setRequests((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddFriend = async (receiverId: string) => {
    if (!currentUserId || pendingSentRequestIds.has(receiverId)) return;
    try {
      await friendApi.sendFriendRequest(currentUserId, receiverId);
      setPendingSentRequestIds((prev) => {
        const next = new Set(prev);
        next.add(receiverId);
        return next;
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Cannot send friend request",
      );
    }
  };

  const handleDirectMessageSearch = useCallback(
    async (user: SearchUserItem) => {
      try {
        const conversation = await chatApi.createConversation({
          receiverId: user.id,
        });

        const conversationId = conversation?.conversationId;
        if (!conversationId) {
          throw new Error("Failed to open conversation");
        }

        router.push({
          pathname: "/chat/[id]",
          params: {
            id: conversationId,
            name: user.fullName,
            avatarUri: user.avatarUrl || "",
          },
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Cannot open direct message",
        );
      }
    },
    [router],
  );

  const openFriendView = useCallback(
    (
      targetUserId: string,
      mode: "friend" | "suggested",
      fallback?: { name: string; avatar?: string; isOnline?: boolean },
    ) => {
      router.push({
        pathname: "/friend-view",
        params: {
          userId: targetUserId,
          mode,
          name: fallback?.name || "Friend",
          avatar: fallback?.avatar || "",
          isOnline: fallback?.isOnline ? "1" : "0",
          pending: pendingSentRequestIds.has(targetUserId) ? "1" : "0",
        },
      });
    },
    [pendingSentRequestIds, router],
  );

  const handleFriendRowMore = (friend: FriendItem) => {
    Alert.alert("Friend actions", friend.name, [
      {
        text: "View info",
        onPress: () => {
          openFriendView(friend.id, "friend", {
            name: friend.name,
            avatar: friend.avatar,
            isOnline: friend.isOnline,
          });
        },
      },
      {
        text: "Delete friend",
        style: "destructive",
        onPress: () => {
          handleRequestRemoveFriend(friend.id);
        },
      },
      {
        text: "Block",
        style: "destructive",
        onPress: () => {
          handleRequestBlockFriend(friend.id);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleRequestRemoveFriend = (friendId: string) => {
    if (!currentUserId) return;
    Alert.alert(
      "Delete Friend",
      "Are you sure you want to remove this friend from your friend list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await friendApi.removeFriend(currentUserId, friendId);
              setFriends((prev) => prev.filter((item) => item.id !== friendId));
              setRecentlyActive((prev) =>
                prev.filter((item) => item.id !== friendId),
              );
            } catch (error) {
              setErrorMessage(
                error instanceof Error ? error.message : "Cannot remove friend",
              );
            }
          },
        },
      ],
    );
  };

  const handleRequestBlockFriend = (friendId: string) => {
    if (!currentUserId) return;
    Alert.alert(
      "Block Friend",
      "Are you sure you want to block this friend? They won't be able to send you messages or calls.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await friendApi.blockFriend(currentUserId, friendId);
              const target =
                friends.find((item) => item.id === friendId) ||
                recentlyActive.find((item) => item.id === friendId);

              setFriends((prev) => prev.filter((item) => item.id !== friendId));
              setRecentlyActive((prev) =>
                prev.filter((item) => item.id !== friendId),
              );

              if (target) {
                setBlockedFriends((prev) => [
                  {
                    id: target.id,
                    name: target.name,
                    avatar: target.avatar,
                    blockedAt: new Date().toISOString(),
                    isOnline: target.isOnline,
                  },
                  ...prev,
                ]);
              }
            } catch (error) {
              setErrorMessage(
                error instanceof Error ? error.message : "Cannot block friend",
              );
            }
          },
        },
      ],
    );
  };

  const handleUnblockFriend = async (friendId: string) => {
    if (!currentUserId) return;
    try {
      await friendApi.unblockFriend(currentUserId, friendId);
      setBlockedFriends((prev) => prev.filter((item) => item.id !== friendId));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Cannot unblock user",
      );
    }
  };

  const buildDirectConversationId = useCallback((userA: string, userB: string) => {
    const [first, second] = [userA, userB].sort();
    return `direct:${first}:${second}`;
  }, []);

  const handleCallFriend = useCallback(
    async (friend: FriendItem, callType: CallType) => {
      if (!callContext) {
        return;
      }

      if (!currentUserId) {
        setErrorMessage("Missing current user identity. Please re-login.");
        return;
      }

      if (!friend.isOnline) {
        setErrorMessage("Friend is offline.");
        return;
      }

      if (callContext.status !== "idle") {
        setErrorMessage("You are already in another call.");
        return;
      }

      try {
        setErrorMessage(null);
        const conversationId = buildDirectConversationId(currentUserId, friend.id);
        await callContext.initiateCall(conversationId, friend.id, callType, {
          name: friend.name,
          avatar: friend.avatar,
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Cannot start call",
        );
      }
    },
    [buildDirectConversationId, callContext, currentUserId],
  );

  const handleAcceptGroupInvite = async (inviteId: string) => {
    if (!currentUserId) return;
    await friendApi.acceptGroupInvite(inviteId, currentUserId);
    setGroupInvites((prev) => prev.filter((item) => item.id !== inviteId));
    const refreshedGroups = await friendApi.getMyGroups(currentUserId);
    setGroups(refreshedGroups);
  };

  const handleDeclineGroupInvite = async (inviteId: string) => {
    if (!currentUserId) return;
    await friendApi.declineGroupInvite(inviteId, currentUserId);
    setGroupInvites((prev) => prev.filter((item) => item.id !== inviteId));
  };

  const handleOpenGroupChat = useCallback(
    async (group: GroupItem) => {
      if (!group.id) return;

      try {
        const conversation = await chatApi.getConversation(group.id);
        const conversationId = conversation?.conversationId || group.id;

        router.push({
          pathname: "/chat/[id]",
          params: {
            id: conversationId,
            name: group.name,
            avatarUri: group.avatar || "",
          },
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Cannot open group chat",
        );
      }
    },
    [router],
  );

  const handleGroupCall = useCallback(
    async (group: GroupItem, callType: CallType) => {
      if (!groupCallContext) {
        return;
      }

      if (!currentUserId) {
        setErrorMessage("Missing current user identity. Please re-login.");
        return;
      }

      if ((callContext && callContext.status !== "idle") || groupCallContext.status !== "idle") {
        setErrorMessage("You are already in another call.");
        return;
      }

      try {
        setErrorMessage(null);
        const membersResponse = await friendApi.getGroupMembers(group.id);
        const members = membersResponse.items || [];
        const participantIds = members
          .filter((member) => member.userId !== currentUserId)
          .map((member) => member.userId);

        if (participantIds.length === 0) {
          setErrorMessage("No other participants in this group.");
          return;
        }

        const participantNames: Record<string, string> = {};
        members.forEach((member) => {
          if (member.userId !== currentUserId) {
            participantNames[member.userId] = member.fullName;
          }
        });

        await groupCallContext.initiateGroupCall(
          group.id,
          participantIds,
          callType,
          participantNames,
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Cannot start group call",
        );
      }
    },
    [callContext, currentUserId, groupCallContext],
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={[]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingTop: insets.top + 11,
          paddingBottom: 2,
          backgroundColor: '#fff',
          borderBottomWidth: 0,
          borderBottomColor: '#e5e7eb',
        }}
      >
        <TouchableOpacity
          onPress={openMenu}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Menu size={20} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-primary">Friends</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={20} color="#505050" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void loadData(true);
            }}
            colors={[colors.primary]}
          />
        }
      >
        <View className="px-4 py-3">
          <View className="flex-row items-center bg-gray-light rounded-xl px-4 py-1">
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
              placeholder="Search friends, users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-base"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <FriendCategoryTabs
          activeCategory={activeCategory}
          onChange={setActiveCategory}
          counts={{
            friends: friends.length,
            requests: requests.length,
            groups: groups.length,
            groupInvites: groupInvites.length,
            blocked: blockedFriends.length,
          }}
        />

        {loading && (
          <View className="py-10 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {!loading && errorMessage && (
          <View className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <Text className="text-red-600">{errorMessage}</Text>
          </View>
        )}

        {!loading && searchResults.length > 0 && (
          <View className="px-4 pb-4">
            <Text className="text-base font-bold text-gray-primary mb-2">
              Search users
            </Text>
            {searchResults.map((user) => (
              <SearchUserRow
                key={user.id}
                user={user}
                isPending={pendingSentRequestIds.has(user.id)}
                onAdd={(userId) => void handleAddFriend(userId)}
                onMessage={() => void handleDirectMessageSearch(user)}
              />
            ))}
          </View>
        )}

        {!loading && activeCategory === "friends" && (
          <>
            <View className="px-4 pb-2">
              <Text className="text-lg font-bold text-gray-primary">Friends</Text>
            </View>
            {filteredFriends.map((friend) => (
              <FriendRow
                key={friend.id}
                friend={friend}
                onPress={(item) => {
                  openFriendView(item.id, "friend", {
                    name: item.name,
                    avatar: item.avatar,
                    isOnline: item.isOnline,
                  });
                }}
                onMorePress={handleFriendRowMore}
                onAudioCall={(item) => void handleCallFriend(item, "audio")}
                onVideoCall={(item) => void handleCallFriend(item, "video")}
              />
            ))}

            <View className="px-4 pt-5 pb-2">
              <Text className="text-lg font-bold text-gray-primary">
                Suggested by mutual groups
              </Text>
            </View>
            {filteredSuggestions.map((friend) => (
              <TouchableOpacity
                key={friend.id}
                activeOpacity={0.85}
                onPress={() => {
                  openFriendView(friend.id, "suggested", {
                    name: friend.name,
                    avatar: friend.avatar,
                    isOnline: false,
                  });
                }}
                className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100"
              >
                <View className="flex-row items-center flex-1">
                  <Avatar uri={friend.avatar} name={friend.name} size="md" />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-semibold text-gray-primary">
                      {friend.name}
                    </Text>
                    <Text className="text-sm text-gray-text">
                      {friend.mutualGroupCount} mutual groups
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  disabled={pendingSentRequestIds.has(friend.id)}
                  onPress={() => void handleAddFriend(friend.id)}
                  className="px-4 py-2 rounded-lg disabled:opacity-70"
                  style={{ backgroundColor: colors.primaryLight }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "600" }}>
                    {pendingSentRequestIds.has(friend.id)
                      ? "Request sent"
                      : "Add"}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            <View className="px-4 pt-5 pb-2">
              <Text className="text-lg font-bold text-gray-primary">
                Recently Active
              </Text>
            </View>
            <FlatList
              data={recentlyActive}
              keyExtractor={(item) => item.id}
              horizontal
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingBottom: 12,
              }}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    openFriendView(item.id, "friend", {
                      name: item.name,
                      avatar: item.avatar,
                      isOnline: item.isOnline,
                    });
                  }}
                  className="items-center mx-2"
                >
                  <Avatar
                    uri={item.avatar}
                    name={item.name}
                    size="lg"
                    showOnline={item.isOnline}
                  />
                  <Text
                    className="text-sm font-medium text-gray-primary mt-2"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {!loading && activeCategory === "requests" && (
          <View>
            {requests.map((request) => (
              <FriendRequestRow
                key={request.id}
                request={request}
                onAccept={(id) => void handleAccept(id)}
                onDecline={(id) => void handleDecline(id)}
              />
            ))}
          </View>
        )}

        {!loading && activeCategory === "groups" && (
          <View>
            {groups.map((group) => (
              <GroupRow
                key={group.id}
                group={group}
                onPress={(item) => {
                  void handleOpenGroupChat(item);
                }}
                onAudioCall={(item) => {
                  void handleGroupCall(item, "audio");
                }}
                onVideoCall={(item) => {
                  void handleGroupCall(item, "video");
                }}
              />
            ))}
          </View>
        )}

        {!loading && activeCategory === "group_invites" && (
          <View>
            {groupInvites.map((invite) => (
              <GroupInviteRow
                key={invite.id}
                invite={invite}
                onAccept={(inviteId) => void handleAcceptGroupInvite(inviteId)}
                onDecline={(inviteId) =>
                  void handleDeclineGroupInvite(inviteId)
                }
              />
            ))}
          </View>
        )}

        {!loading && activeCategory === "blocked" && (
          <View>
            {blockedFriends.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center border-b border-gray-100 px-4 py-3"
              >
                <Avatar uri={item.avatar} name={item.name} size="md" />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-gray-primary">
                    {item.name}
                  </Text>
                  <Text className="text-sm text-gray-text">Blocked</Text>
                </View>
                <TouchableOpacity
                  onPress={() => void handleUnblockFriend(item.id)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5"
                >
                  <Text className="text-sm font-semibold text-gray-primary">
                    Unblock
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {!loading &&
          !errorMessage &&
          activeCategory === "friends" &&
          filteredFriends.length === 0 && (
            <View className="py-8 items-center">
              <Text className="text-gray-text">No friends found.</Text>
            </View>
          )}

        {!loading &&
          !errorMessage &&
          activeCategory === "requests" &&
          requests.length === 0 && (
            <View className="py-8 items-center">
              <Text className="text-gray-text">No pending requests.</Text>
            </View>
          )}

        {!loading &&
          !errorMessage &&
          activeCategory === "groups" &&
          groups.length === 0 && (
            <View className="py-8 items-center">
              <Text className="text-gray-text">No groups yet.</Text>
            </View>
          )}

        {!loading &&
          !errorMessage &&
          activeCategory === "group_invites" &&
          groupInvites.length === 0 && (
            <View className="py-8 items-center">
              <Text className="text-gray-text">No group invites.</Text>
            </View>
          )}

        {!loading &&
          !errorMessage &&
          activeCategory === "blocked" &&
          blockedFriends.length === 0 && (
            <View className="py-8 items-center">
              <Text className="text-gray-text">No blocked users.</Text>
            </View>
          )}
      </ScrollView>

    </SafeAreaView>
  );
}
