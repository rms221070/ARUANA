import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/context/SettingsContext";
import { Users, MessageSquare, Heart, Send, Plus, Mail, Building, BookOpen, Trash2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ScientificCollaboration = () => {
  const { settings } = useSettings();
  const [researchers, setResearchers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState("");
  
  const [profileForm, setProfileForm] = useState({
    name: "",
    institution: "",
    area: "",
    bio: "",
    research_interests: "",
    contact_email: ""
  });

  const [postForm, setPostForm] = useState({
    author_id: "temp_user",
    author_name: "",
    content: "",
    tags: ""
  });

  useEffect(() => {
    fetchResearchers();
    fetchPosts();
  }, []);

  const fetchResearchers = async () => {
    try {
      const response = await axios.get(`${API}/researchers`);
      setResearchers(response.data);
    } catch (error) {
      console.error("Error loading researchers");
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error("Error loading posts");
    }
  };

  const fetchComments = async (postId) => {
    try {
      const response = await axios.get(`${API}/comments/${postId}`);
      setComments(prev => ({ ...prev, [postId]: response.data }));
    } catch (error) {
      console.error("Error loading comments");
    }
  };

  const createProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/researchers`, {
        ...profileForm,
        research_interests: profileForm.research_interests.split(",").map(i => i.trim())
      });
      toast.success("Perfil criado com sucesso!");
      setShowProfileForm(false);
      setProfileForm({
        name: "",
        institution: "",
        area: "",
        bio: "",
        research_interests: "",
        contact_email: ""
      });
      fetchResearchers();
    } catch (error) {
      toast.error("Erro ao criar perfil");
    }
  };

  const createPost = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/posts`, {
        ...postForm,
        tags: postForm.tags.split(",").map(t => t.trim())
      });
      toast.success("Post publicado!");
      setShowPostForm(false);
      setPostForm({
        author_id: "temp_user",
        author_name: "",
        content: "",
        tags: ""
      });
      fetchPosts();
    } catch (error) {
      toast.error("Erro ao publicar post");
    }
  };

  const likePost = async (postId) => {
    try {
      await axios.post(`${API}/posts/${postId}/like`);
      fetchPosts();
    } catch (error) {
      toast.error("Erro ao curtir post");
    }
  };

  const addComment = async (postId) => {
    if (!newComment.trim()) return;
    
    try {
      await axios.post(`${API}/comments`, {
        post_id: postId,
        author_id: "temp_user",
        author_name: "Usuário",
        content: newComment
      });
      setNewComment("");
      fetchComments(postId);
      fetchPosts();
      toast.success("Comentário adicionado!");
    } catch (error) {
      toast.error("Erro ao comentar");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6" data-testid="scientific-collaboration">
      {/* Header */}
      <Card className={`${
        settings.highContrast 
          ? 'bg-gray-900 border-white border-2' 
          : 'bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-slate-950/90 backdrop-blur-xl border-indigo-700/30 shadow-2xl'
      }`}>
        <CardHeader>
          <CardTitle className={`text-2xl flex items-center gap-2 ${
            settings.highContrast ? 'text-white' : 'text-cyan-300'
          }`}>
            <Users className="w-7 h-7" />
            Colaboração Científica
          </CardTitle>
          <p className={`text-sm ${settings.highContrast ? 'text-gray-300' : 'text-gray-300'}`}>
            Conecte-se com pesquisadores, compartilhe conhecimento e colabore em projetos
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className={`grid w-full grid-cols-2 ${
          settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-indigo-950/80 backdrop-blur-sm'
        }`}>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="researchers">Pesquisadores</TabsTrigger>
        </TabsList>

        {/* Feed Tab */}
        <TabsContent value="feed" className="space-y-4">
          <Button
            onClick={() => setShowPostForm(!showPostForm)}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Publicação
          </Button>

          {showPostForm && (
            <Card className={`${
              settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-indigo-950/90 backdrop-blur-xl border-indigo-700/30'
            } animate-fade-in`}>
              <CardContent className="pt-6">
                <form onSubmit={createPost} className="space-y-4">
                  <Input
                    placeholder="Seu nome"
                    value={postForm.author_name}
                    onChange={(e) => setPostForm({...postForm, author_name: e.target.value})}
                    required
                    className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}
                  />
                  <Textarea
                    placeholder="Compartilhe suas ideias, descobertas ou questões..."
                    value={postForm.content}
                    onChange={(e) => setPostForm({...postForm, content: e.target.value})}
                    required
                    rows={4}
                    className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}
                  />
                  <Input
                    placeholder="Tags (separadas por vírgula)"
                    value={postForm.tags}
                    onChange={(e) => setPostForm({...postForm, tags: e.target.value})}
                    className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-gradient-to-r from-cyan-600 to-blue-600">
                      <Send className="w-4 h-4 mr-2" />
                      Publicar
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowPostForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Posts */}
          <div className="space-y-4">
            {posts.map((post) => (
              <Card
                key={post.id}
                className={`${
                  settings.highContrast 
                    ? 'bg-gray-900 border-white border-2' 
                    : 'bg-gradient-to-br from-indigo-950/90 to-purple-950/90 backdrop-blur-xl border-indigo-700/30 hover:border-cyan-500/50'
                } transition-all duration-300 animate-fade-in`}
              >
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-cyan-600 text-white">
                        {post.author_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold ${settings.highContrast ? 'text-white' : 'text-white'}`}>
                            {post.author_name}
                          </p>
                          <p className={`text-xs ${settings.highContrast ? 'text-gray-400' : 'text-gray-400'}`}>
                            {formatDate(post.created_at)}
                          </p>
                        </div>
                      </div>
                      <p className={`mt-3 ${settings.highContrast ? 'text-gray-200' : 'text-gray-200'}`}>
                        {post.content}
                      </p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {post.tags.map((tag, i) => (
                            <span
                              key={i}
                              className={`text-xs px-2 py-1 rounded-full ${
                                settings.highContrast ? 'bg-gray-800 text-gray-300' : 'bg-cyan-900/30 text-cyan-300'
                              }`}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center gap-4 mt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => likePost(post.id)}
                          className={`${settings.highContrast ? 'text-white' : 'text-gray-300'} hover:text-red-400`}
                        >
                          <Heart className="w-4 h-4 mr-1" />
                          {post.likes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (selectedPost === post.id) {
                              setSelectedPost(null);
                            } else {
                              setSelectedPost(post.id);
                              fetchComments(post.id);
                            }
                          }}
                          className={settings.highContrast ? 'text-white' : 'text-gray-300'}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {post.comments_count}
                        </Button>
                      </div>

                      {/* Comments Section */}
                      {selectedPost === post.id && (
                        <div className={`mt-4 p-4 rounded-lg ${
                          settings.highContrast ? 'bg-gray-800' : 'bg-indigo-900/30'
                        } space-y-3`}>
                          {comments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-purple-600 text-white text-xs">
                                  {comment.author_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className={`text-sm font-semibold ${settings.highContrast ? 'text-white' : 'text-white'}`}>
                                  {comment.author_name}
                                </p>
                                <p className={`text-sm ${settings.highContrast ? 'text-gray-300' : 'text-gray-300'}`}>
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          ))}
                          
                          <div className="flex gap-2 mt-3">
                            <Input
                              placeholder="Adicionar comentário..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && addComment(post.id)}
                              className={settings.highContrast ? 'bg-gray-700 text-white border-white' : 'bg-indigo-800/50 text-white'}
                            />
                            <Button
                              onClick={() => addComment(post.id)}
                              size="sm"
                              className="bg-cyan-600 hover:bg-cyan-700"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Researchers Tab */}
        <TabsContent value="researchers" className="space-y-4">
          <Button
            onClick={() => setShowProfileForm(!showProfileForm)}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Perfil
          </Button>

          {showProfileForm && (
            <Card className={`${
              settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-indigo-950/90 backdrop-blur-xl border-indigo-700/30'
            } animate-fade-in`}>
              <CardContent className="pt-6">
                <form onSubmit={createProfile} className="space-y-4">
                  <Input
                    placeholder="Nome completo"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    required
                    className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}
                  />
                  <Input
                    placeholder="Instituição"
                    value={profileForm.institution}
                    onChange={(e) => setProfileForm({...profileForm, institution: e.target.value})}
                    required
                    className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}
                  />
                  <Input
                    placeholder="Área de atuação"
                    value={profileForm.area}
                    onChange={(e) => setProfileForm({...profileForm, area: e.target.value})}
                    required
                    className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}
                  />
                  <Textarea
                    placeholder="Bio / Sobre você"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                    required
                    rows={3}
                    className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}
                  />
                  <Input
                    placeholder="Interesses de pesquisa (separados por vírgula)"
                    value={profileForm.research_interests}
                    onChange={(e) => setProfileForm({...profileForm, research_interests: e.target.value})}
                    className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}
                  />
                  <Input
                    type="email"
                    placeholder="Email para contato"
                    value={profileForm.contact_email}
                    onChange={(e) => setProfileForm({...profileForm, contact_email: e.target.value})}
                    required
                    className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-gradient-to-r from-cyan-600 to-blue-600">
                      Salvar Perfil
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowProfileForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Researchers List */}
          <div className="grid md:grid-cols-2 gap-4">
            {researchers.map((researcher, idx) => (
              <Card
                key={researcher.id}
                className={`${
                  settings.highContrast 
                    ? 'bg-gray-900 border-white border-2' 
                    : 'bg-gradient-to-br from-indigo-950/90 to-purple-950/90 backdrop-blur-xl border-indigo-700/30 hover:border-cyan-500/50'
                } transition-all duration-300 hover:scale-105 animate-slide-up`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-2xl">
                        {researcher.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold ${settings.highContrast ? 'text-white' : 'text-white'}`}>
                        {researcher.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-cyan-400 mt-1">
                        <Building className="w-3 h-3" />
                        {researcher.institution}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-purple-400 mt-1">
                        <BookOpen className="w-3 h-3" />
                        {researcher.area}
                      </div>
                      <p className={`text-sm mt-3 ${settings.highContrast ? 'text-gray-300' : 'text-gray-300'}`}>
                        {researcher.bio}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {researcher.research_interests.map((interest, i) => (
                          <span
                            key={i}
                            className={`text-xs px-2 py-1 rounded-full ${
                              settings.highContrast ? 'bg-gray-800 text-gray-300' : 'bg-cyan-900/30 text-cyan-300'
                            }`}
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                      <Button
                        className="mt-4 w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                        onClick={() => window.location.href = `mailto:${researcher.contact_email}`}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Entrar em Contato
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScientificCollaboration;
