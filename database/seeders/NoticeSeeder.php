<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NoticeSeeder extends Seeder
{
    public function run(): void
    {
        $adminId  = DB::table('users')->where('email', 'admin@gmail.com')->value('id');
        $category = 'notice';

        if (!$adminId) {
            $this->command->warn('admin@gmail.com 계정을 찾을 수 없습니다.');
            return;
        }

        $notices = [
            [
                'title'   => 'KRLived 서비스 소개 및 이용 안내',
                'content' => '<p>안녕하세요, KRLived 운영팀입니다.</p>
<p>KRLived는 국내외 다양한 커뮤니티의 인기 게시글과 실시간 금융 정보를 한 곳에서 편리하게 확인할 수 있는 통합 커뮤니티 포털입니다.</p>
<h3>주요 서비스 안내</h3>
<ul>
<li><strong>커뮤니티 게시판</strong>: 유머, 연예, 스포츠, 게임, IT, 생활 등 다양한 주제의 게시글을 읽고 직접 작성하실 수 있습니다.</li>
<li><strong>인기글 랭킹</strong>: 최근 7일간 가장 많이 읽힌 인기 게시글을 실시간으로 확인하세요.</li>
<li><strong>실시간 금융 정보</strong>: 코스닥·나스닥 주식 시세, 달러·유로·엔화 환율, 비트코인·이더리움 가상화폐, 금·은 시세를 실시간으로 제공합니다.</li>
<li><strong>통합 검색</strong>: 원하는 키워드로 전체 게시판을 한 번에 검색할 수 있습니다.</li>
</ul>
<p>서비스 이용 중 불편한 점이 있으시면 언제든지 1:1 문의를 통해 연락해 주세요. 빠르게 도움을 드리겠습니다.</p>
<p>감사합니다.</p>',
                'is_notice' => true,
            ],
            [
                'title'   => '커뮤니티 이용 수칙 안내',
                'content' => '<p>안녕하세요, KRLived 운영팀입니다.</p>
<p>즐거운 커뮤니티 문화를 만들기 위해 아래 이용 수칙을 반드시 준수해 주시기 바랍니다.</p>
<h3>기본 수칙</h3>
<ul>
<li>타인을 비방하거나 욕설, 혐오 표현이 포함된 게시글·댓글은 운영팀에 의해 삭제될 수 있습니다.</li>
<li>음란물, 성인 콘텐츠, 불법 정보 등은 절대 게시할 수 없습니다.</li>
<li>타인의 개인정보를 무단으로 게시하는 행위는 법적 처벌을 받을 수 있습니다.</li>
<li>동일한 게시글을 반복적으로 올리는 도배 행위는 제한됩니다.</li>
<li>영리를 목적으로 하는 광고성 게시글은 사전 협의 없이 삭제됩니다.</li>
</ul>
<h3>저작권 관련</h3>
<p>타인의 저작물을 게시할 경우 출처를 명시해 주세요. 저작권 침해가 확인된 게시글은 즉시 삭제 조치됩니다.</p>
<h3>제재 기준</h3>
<p>이용 수칙을 위반할 경우 경고 후 일정 기간 서비스 이용이 제한될 수 있으며, 심각한 위반의 경우 영구 이용 정지 조치가 취해질 수 있습니다.</p>
<p>건전한 커뮤니티 문화를 함께 만들어 주셔서 감사합니다.</p>',
                'is_notice' => true,
            ],
            [
                'title'   => '개인정보처리방침 및 이용약관 안내',
                'content' => '<p>안녕하세요, KRLived 운영팀입니다.</p>
<p>KRLived는 이용자의 개인정보를 소중히 여기며, 관련 법령을 준수하여 안전하게 관리하고 있습니다.</p>
<h3>개인정보 수집 항목</h3>
<ul>
<li>회원가입 시: 이메일 주소, 닉네임, 비밀번호(암호화 저장)</li>
<li>서비스 이용 중 자동 수집: 접속 IP, 쿠키, 서비스 이용 기록</li>
</ul>
<h3>개인정보 이용 목적</h3>
<p>수집된 개인정보는 회원 관리, 서비스 제공, 고객 문의 응답 목적으로만 사용되며, 제3자에게 제공되지 않습니다.</p>
<h3>관련 문서 확인</h3>
<ul>
<li>개인정보처리방침 전문은 <a href="/privacy">이 페이지</a>에서 확인하실 수 있습니다.</li>
<li>이용약관 전문은 <a href="/terms">이 페이지</a>에서 확인하실 수 있습니다.</li>
</ul>
<p>개인정보 관련 문의사항은 운영팀 이메일(kimiman0627@gmail.com)로 연락해 주시기 바랍니다.</p>',
                'is_notice' => true,
            ],
            [
                'title'   => '실시간 금융 정보 위젯 안내',
                'content' => '<p>안녕하세요, KRLived 운영팀입니다.</p>
<p>KRLived 사이드바에서 다양한 실시간 금융 정보를 제공하고 있습니다. 각 위젯에 대해 안내해 드립니다.</p>
<h3>제공 금융 정보</h3>
<ul>
<li><strong>환율</strong>: 달러(USD), 유로(EUR), 엔화(JPY/100엔) 원화 환산 시세. 유럽중앙은행(ECB) 기준 데이터를 5분마다 갱신합니다.</li>
<li><strong>주식</strong>: 코스닥·나스닥 거래대금 상위 5개 종목의 실시간 시세. 1분마다 자동 갱신됩니다.</li>
<li><strong>가상화폐</strong>: 비트코인(BTC), 이더리움(ETH), 리플(XRP)의 원화 기준 시세. 업비트 데이터를 1분마다 갱신합니다.</li>
<li><strong>금·은</strong>: 뉴욕 선물시장(COMEX) 기준 금·은 USD 시세. 5분마다 갱신됩니다.</li>
</ul>
<h3>유의사항</h3>
<p>제공되는 금융 정보는 참고용이며, 실제 투자 결정에는 전문 금융기관의 정보를 이용하시기 바랍니다. KRLived는 금융 정보의 정확성에 대해 법적 책임을 지지 않습니다.</p>
<p>더 좋은 서비스를 위해 지속적으로 개선해 나가겠습니다. 감사합니다.</p>',
                'is_notice' => false,
            ],
            [
                'title'   => '게시글 작성 및 서비스 이용 팁',
                'content' => '<p>안녕하세요, KRLived 운영팀입니다.</p>
<p>더 편리한 서비스 이용을 위한 팁을 안내해 드립니다.</p>
<h3>게시글 작성 팁</h3>
<ul>
<li>제목은 내용을 잘 나타낼 수 있도록 구체적으로 작성해 주세요.</li>
<li>이미지는 드래그 앤 드롭 또는 파일 첨부 버튼으로 삽입할 수 있습니다.</li>
<li>작성한 게시글은 마이페이지 > 내 게시글에서 확인하고 관리할 수 있습니다.</li>
</ul>
<h3>유용한 기능 안내</h3>
<ul>
<li><strong>스크랩</strong>: 마음에 드는 게시글을 스크랩해 두면 마이페이지에서 언제든지 다시 볼 수 있습니다.</li>
<li><strong>좋아요/싫어요</strong>: 게시글에 대한 의견을 표현할 수 있습니다.</li>
<li><strong>신고</strong>: 부적절한 게시글은 신고 버튼을 통해 운영팀에 알려주세요.</li>
<li><strong>통합 검색</strong>: 상단 검색바를 통해 전체 게시판에서 원하는 내용을 검색할 수 있습니다.</li>
</ul>
<h3>비밀번호 변경</h3>
<p>계정 보안을 위해 주기적으로 비밀번호를 변경하시는 것을 권장합니다. 마이페이지 > 비밀번호 변경에서 변경하실 수 있습니다.</p>
<p>서비스 이용 중 불편한 점이 있으시면 1:1 문의를 통해 알려주세요. 감사합니다.</p>',
                'is_notice' => false,
            ],
            [
                'title'   => '인기글 선정 기준 안내',
                'content' => '<p>안녕하세요, KRLived 운영팀입니다.</p>
<p>메인 페이지 및 인기글 페이지에 표시되는 인기 게시글 선정 기준에 대해 안내해 드립니다.</p>
<h3>인기글 선정 기준</h3>
<p>인기글은 최근 7일 이내 작성된 게시글 중에서 다음 기준을 종합적으로 평가하여 선정됩니다.</p>
<ul>
<li><strong>조회수</strong>: 게시글이 조회된 횟수</li>
<li><strong>댓글 수</strong>: 게시글에 달린 댓글 수 (조회수 대비 가중치 적용)</li>
<li><strong>좋아요 수</strong>: 이용자들이 좋아요를 누른 횟수</li>
</ul>
<h3>인기글 갱신 주기</h3>
<p>인기글 목록은 실시간으로 업데이트되며, 새로운 게시글이 빠르게 상위권에 진입할 수 있도록 최신성을 반영합니다.</p>
<h3>인기글 제외 기준</h3>
<p>다음에 해당하는 게시글은 인기글에서 제외될 수 있습니다.</p>
<ul>
<li>이용 수칙을 위반한 게시글</li>
<li>신고가 누적된 게시글</li>
<li>운영팀이 부적절하다고 판단한 게시글</li>
</ul>
<p>앞으로도 다양하고 유익한 콘텐츠로 채워지는 KRLived가 될 수 있도록 많은 참여 부탁드립니다. 감사합니다.</p>',
                'is_notice' => false,
            ],
        ];

        $now = now();
        foreach ($notices as $idx => $notice) {
            $exists = DB::table('posts')
                ->where('post_category', $category)
                ->where('title', $notice['title'])
                ->exists();

            if ($exists) {
                $this->command->line("이미 존재: {$notice['title']}");
                continue;
            }

            DB::table('posts')->insert([
                'user_id'       => $adminId,
                'post_category' => $category,
                'post_type'     => 'general',
                'title'         => $notice['title'],
                'content'       => $notice['content'],
                'post_status'   => 'ACTIVE',
                'is_notice'     => $notice['is_notice'],
                'hits'          => 0,
                'comment_count' => 0,
                'like_count'    => 0,
                'dislike_count' => 0,
                'created_at'    => $now->copy()->subMinutes($idx * 10),
                'updated_at'    => $now->copy()->subMinutes($idx * 10),
            ]);

            $this->command->info("작성 완료: {$notice['title']}");
        }
    }
}
