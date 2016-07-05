function showDoc() {
	hash = window.location.hash;
	re = /^#[a-zA-Z_0-9]+$/;
	if(re.test(hash)) {
		$("div.show").removeClass();
		$("div" + hash).addClass("show");
	} else {
		$("div.show").removeClass();
		$("div#history").addClass("show");
	}
	
	// title change
	title = document.title;
	document.title = title.replace(/^([^:]+).*$/, function(match, p1, offset, string) {
		return p1 + " :: " + $("body > div.show > h2:first").text();
	});

}

function check_img_safari(src) {
	re = /^webkit-fake-url:\/\/[a-f0-9\-]+\/image\.(png|gif|tiff|jpeg|jpg)$/;
	return re.test(src);	
}

//
// for #paste page
//
var oldImg = null;

function imageToCanvas(simg) {
	
	// store
	oldImg = simg;

	// draw canvas
	var src = {w: 0, h: 0};
	src.w = simg.width;
	src.h = simg.height;
	var dst = {w: 1500, h: 500};

	var scale = parseInt($("select#pixelscale option:selected").html(), 10);
	var tile  = parseInt($("#headertile").val(), 10);

	switch (tile) {
	case 1:
		break;
	case 2:
		dst.w = parseInt($("input#tilewidth").val(), 10);
		dst.h = parseInt($("input#tileheight").val(), 10);
		dst.w = dst.w > 0 ? dst.w : 1;
		dst.h = dst.h > 0 ? dst.h : 1;
		dst.w = dst.w > 2048 ? 2048 : dst.w;
		dst.h = dst.h > 2048 ? 2048 : dst.h;
		break;
	default:
		// no tile
		dst.w = src.w * scale > 2048 ? 2048 : src.w * scale;
		dst.h = src.h * scale > 2048 ? 2048 : src.h * scale;
		break;
	}

	// set canvas size
	$("canvas#pasteimg")[0].width = dst.w;
	$("canvas#pasteimg")[0].height = dst.h;

	// prepare to write canvas
	var canvas = $("canvas#pasteimg")[0];
	var ctx = canvas.getContext('2d');

	// not smoooooth!!
	ctx.imageSmoothingEnabled = false;
	ctx.msImageSmoothingEnabled = false;
	ctx.mozImageSmoothingEnabled = false;

	if(tile > 0) {
		// fill tiling
		for(y = 0; y < dst.h; y += src.h * scale) {
			for (x = 0; x < dst.w; x += src.w * scale) {
				ctx.drawImage(simg, x, y, src.w * scale, src.h * scale);
			}
		}
	} else {
		// normal
		ctx.drawImage(simg, 0, 0, src.w * scale, src.h * scale);
	}

	// 0,0 alpha data transform
	var p = ctx.getImageData(0, 0, 1, 1);
	if (p.data[3]  == 0xFF) {
		p.data[3] = 0xFE;
	}
	ctx.putImageData(p, 0, 0);

	// show png image
	$("img#pngimg").attr("src", canvas.toDataURL());


	// clear canvas size
	$("canvas#pasteimg")[0].width = 0;
	$("canvas#pasteimg")[0].height = 0;

	// delete non used img file
	$("p#hookPaste > img").remove();
}



//
// for #mono page
//

function imageToMono(simg) {
	

	// draw canvas
	var src = {w: 0, h: 0};
	src.w = simg.width;
	src.h = simg.height;

	if(src.w > 256 || src.h > 256) {
		$("textarea#monocode").text("画像サイズが大きい(256x256超過)の為、処理を停止しました");
	}

	// set canvas size
	$("canvas#origimg")[0].width = src.w;
	$("canvas#origimg")[0].height = src.h;
	$("canvas#monoimg")[0].width = src.w;
	$("canvas#monoimg")[0].height = src.h;

	// prepare to write canvas
	var ocvs = $("canvas#origimg")[0];
	var mcvs = $("canvas#monoimg")[0];
	var octx = ocvs.getContext('2d');
	var mctx = mcvs.getContext('2d');

	octx.drawImage(simg, 0, 0, src.w, src.h);

	var p = octx.getImageData(0, 0, src.w, src.h);

	var txt = "";

	for(var iy = 0; iy < src.h; ++iy) {
		for(var ix = 0; ix < src.w; ++ix) {
			var i = (iy*src.w + ix)*4;
			var sum = p.data[i] + p.data[i+1] + p.data[i+2];
			if(sum > 100) {
				p.data[i] = 255;
				p.data[i+1] = 255;
				p.data[i+2] = 255;
				txt += "1,";
			} else {
				p.data[i] = 0;
				p.data[i+1] = 0;
				p.data[i+2] = 0;
				txt += "0,"
			}
			// for twitter
			if (i == 0 && p.data[i+3] == 0xFF) {
				p.data[i+3] = 0xFE;
			}
		}
		txt += "\n";
	}

	mctx.putImageData(p, 0, 0);

	// show png image
	$("img#monopngimg").attr("src", mcvs.toDataURL());

	// textarea
	$("textarea#monocode").text(txt);


	// clear canvas size
	$("canvas#origimg")[0].width = 0;
	$("canvas#origimg")[0].height = 0;
	$("canvas#monoimg")[0].width = 0;
	$("canvas#monoimg")[0].height = 0;

	// delete non used img file
	$("p#hookMonoPaste > img").remove();
}


function urlToImage(id, url) {

	if(url.indexOf('data:image/gif;base64,')  != 0 &&
	   url.indexOf('data:image/png;base64,')  != 0 &&
	   url.indexOf('data:image/tiff;base64,') != 0 &&
	   url.indexOf('data:image/jpeg;base64,') != 0
	   ) return;
	var simg = new Image();
	simg.onload = function() {
		if(id == "hookPaste") {
			imageToCanvas(simg);
		} else if (id == "hookMonoPaste") {
			imageToMono(simg);
		}
	}
	simg.src = url;
}


function getUrl(id, item) {
	var blob;
	if(typeof item.getAsFile === 'function') {
		blob = item.getAsFile();
	} else {
		blob = item;
	}
	var reader = new FileReader();
	reader.onloadend = function(e){
		urlToImage(id, reader.result);
	};

	if (blob == null) {
		return;
	}

	reader.readAsDataURL(blob);
}

function handlePaste(e) {

	var id = $(this).attr('id');

	var file = null;
	var cpdata = ( window.clipboardData || e.originalEvent.clipboardData );

	if(cpdata.files && cpdata.files[0]) {
		getUrl(id, cpdata.files[0]);
	} else if (cpdata.items && cpdata.items[0]) {
		getUrl(id, cpdata.items[0]);
	} else {
		// maybe firefox not support...
		return;
	}
}

function handleDrop(e) {
	e.stopPropagation();
	e.preventDefault();

	var id = $(this).attr('id');

	$(this).removeClass("drag")

	var dt = (e.dataTransfer || e.originalEvent.dataTransfer);

	if(dt.items != 0 && dt.items.length != 0) {
		getUrl(id, dt.items[0]);
	} else if (dt.files != null && dt.files.length != 0) {
		getUrl(id, dt.files[0]);
	} else {
		console.log(e);
	}
}

function handleDragLeave(e) {
	e.stopPropagation();
	e.preventDefault();
	e.originalEvent.dataTransfer.dropEffect = 'none';
	$(this).removeClass("drag")
}

function handleDragOver(e) {
	e.stopPropagation();
	e.preventDefault();
	e.originalEvent.dataTransfer.dropEffect = 'copy';
	$(this).addClass("drag")
}


$(document).ready(function() {
	showDoc();
	$(window).on('hashchange', showDoc);
	$('nav#top a[href^="#"]').on('click', function (e) {
        	e.preventDefault();
            	window.location.hash = this.hash;
		$(window).scrollTop(0);
        });

	//
	// for #paste, #mono
	//
	// paste
	$("p#hookPaste,p#hookMonoPaste").on("paste", handlePaste);

	// drag and drop
	$("p#hookPaste,p#hookMonoPaste").on("dragover", handleDragOver);
	$("p#hookPaste,p#hookMonoPaste").on("dragleave", handleDragLeave);
	$("p#hookPaste,p#hookMonoPaste").on("dragend", handleDragLeave);
	$("p#hookPaste,p#hookMonoPaste").on("drop", handleDrop);

	// no key input!!! (ctrl or meta[cmd] key is acceptable)
	$("p#hookPaste,p#hookMonoPaste").on('keydown', function(e) {
		if(e.ctrlKey || e.metaKey)
			return;
		e.stopPropagation();
		e.preventDefault();

	});
	// for firefox / safari hack
	$("p#hookPaste,p#hookMonoPaste").on('input', function(e) {
		var id = $(this).attr('id');
		var img = $(this).find("img:first");
		console.log(img);
		if (img.length == 1) {
			if (check_img_safari(img.attr("src"))) {
				// safari
				$(this).text("ここにファイルをドロップするか、カーソルを合わせて画像を貼り付けてください。(Safariはdata:形式の画像を提供していない為、貼り付けはできません)");
			} else {
				// firefox
				urlToImage(id, img.attr("src"));
			}
		} else {
			$(this).text("ここにファイルをドロップするか、カーソルを合わせて画像を貼り付けてください");
		}
	});

	// tile size show / hide
	$("#headertile").on('change', function() {
		if(parseInt($(this).val(), 10) == 2) {
			$("div#tilesize").addClass('show');
		} else {
			$("div#tilesize").removeClass();
		}
	});

	// change status re image creation
	$("#pixelscale, #headertile, #tilewidth, #tileheight").change(function() {
		if(oldImg != null) {imageToCanvas(oldImg);}
	});

;});
