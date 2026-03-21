import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { client } from '../api/client'
import { useAuthStore } from '../stores/authStore'

type Profile = {
    id: string
    username: string
    avatarUrl: string | null
    bio: string | null
    followerCount: number
    followingCount: number
    postCount: number
}

export function ProfilePage() {
    const { userId } = useParams<{ userId: string }>()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [isFollowing, setIsFollowing] = useState(false)
    const [loading, setLoading] = useState(true)

    const currentUser = useAuthStore(s => s.user)
    const isOwnProfile = currentUser?.id === userId

    useEffect(() => {
        if (!userId) return
        client.get<Profile>(`/users/${userId}/profile`)
            .then(res => setProfile(res.data))
            .finally(() => setLoading(false))
    }, [userId])

    const handleFollow = async () => {
        if (!userId) return
        await client.post(`/users/${userId}/follow`)
        setIsFollowing(f => !f)
        setProfile(p => p ? {
            ...p,
            followerCount: p.followerCount + (isFollowing ? -1 : 1)
        } : p)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
                Loading...
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
                User not found.
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">← Feed</Link>
                    <span className="font-bold text-gray-900">{profile.username}</span>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 py-6">
                {/* Profile header */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                                {profile.username[0].toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{profile.username}</h1>
                                {profile.bio && (
                                    <p className="text-sm text-gray-500 mt-0.5">{profile.bio}</p>
                                )}
                            </div>
                        </div>

                        {!isOwnProfile && currentUser && (
                            <button
                                onClick={handleFollow}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    isFollowing
                                        ? 'border border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-500'
                                        : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                                }`}
                            >
                                {isFollowing ? 'Unfollow' : 'Follow'}
                            </button>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 mt-5 pt-5 border-t border-gray-100 text-sm">
                        <div className="text-center">
                            <p className="font-bold text-gray-900">{profile.postCount}</p>
                            <p className="text-gray-500">Posts</p>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-gray-900">{profile.followerCount}</p>
                            <p className="text-gray-500">Followers</p>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-gray-900">{profile.followingCount}</p>
                            <p className="text-gray-500">Following</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
